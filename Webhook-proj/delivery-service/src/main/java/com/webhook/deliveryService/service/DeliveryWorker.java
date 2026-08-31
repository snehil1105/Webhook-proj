package com.webhook.deliveryService.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.webhook.deliveryService.dto.DeliveryJobMessage;
import com.webhook.deliveryService.entity.DeliveryAttempt;
import com.webhook.deliveryService.repository.DeliveryAttemptRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.stream.*;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryWorker {

    private final RedisTemplate<String, String> redisTemplate;
    private final HttpDeliveryService httpDeliveryService;
    private final DeliveryAttemptRepository attemptRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.redis.stream-name}")         private String streamName;
    @Value("${app.redis.retry-stream-name}")   private String retryStreamName;
    @Value("${app.redis.dlq-stream-name}")     private String dlqStreamName;
    @Value("${app.redis.consumer-group}")      private String consumerGroup;
    @Value("${app.redis.consumer-name}")       private String consumerName;
    @Value("${app.delivery.max-attempts}")     private int maxAttempts;

    // Controls the worker loop — set to false on shutdown for graceful stop
    private final AtomicBoolean running = new AtomicBoolean(true);

    // Single-thread executor — one worker polling Redis
    // In production: scale by running multiple instances of this service
    private ExecutorService executor;

    @PostConstruct
    public void start() {
        executor = Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "delivery-worker");
            t.setDaemon(true);   // won't prevent JVM shutdown
            return t;
        });
        executor.submit(this::workerLoop);
        log.info("Delivery worker started — consuming from stream '{}'", streamName);
    }

    @PreDestroy
    public void stop() {
        log.info("Delivery worker shutting down gracefully...");
        running.set(false);
        executor.shutdown();
    }

    private void workerLoop() {
        while (running.get()) {
            try {
                // XREADGROUP: blocking read, waits up to 2 seconds for a new message
                // ">" means: give me only messages not yet delivered to any consumer
                List<MapRecord<String, Object, Object>> messages =
                        redisTemplate.opsForStream().read(
                                Consumer.from(consumerGroup, consumerName),
                                StreamReadOptions.empty().count(1).block(Duration.ofSeconds(2)),
                                StreamOffset.create(streamName, ReadOffset.lastConsumed())
                        );

                if (messages == null || messages.isEmpty()) {
                    continue;  // no message yet, loop again
                }

                for (MapRecord<String, Object, Object> record : messages) {
                    processRecord(record);
                }

            } catch (Exception e) {
                if (running.get()) {
                    log.error("Worker loop error — will retry in 1s", e);
                    sleep(1000);
                }
            }
        }
        log.info("Delivery worker stopped.");
    }

    private void processRecord(MapRecord<String, Object, Object> record) {
        String messageId = record.getId().getValue();

        try {
            // Parse the job from the Redis message
            String jobJson = (String) record.getValue().get("job");
            DeliveryJobMessage job = objectMapper.readValue(jobJson, DeliveryJobMessage.class);

            log.info("Processing job — event {} attempt {} → {}",
                    job.getEventId(), job.getAttemptNumber(), job.getEndpointUrl());

            // Attempt delivery
            HttpDeliveryService.DeliveryResult result = httpDeliveryService.deliver(job);

            if (result.isSuccess()) {
                handleSuccess(job, result, messageId);
            } else {
                handleFailure(job, result, messageId);
            }

        } catch (Exception e) {
            log.error("Failed to process message {}: {}", messageId, e.getMessage(), e);
            // XACK even on processing error — otherwise it stays pending forever
            // The error is logged; the message won't be reprocessed by this path
            ackMessage(streamName, messageId);
        }
    }

    private String serializePayload(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("Failed to serialize payload: " + e.getMessage());
            return null;
        }
    }

    private void handleSuccess(DeliveryJobMessage job,
                                HttpDeliveryService.DeliveryResult result,
                                String messageId) {
        // Persist the success record
        attemptRepository.save(DeliveryAttempt.builder()
                .eventId(job.getEventId())
                .endpointId(job.getEndpointId())
                .endpointUrl(job.getEndpointUrl())
                .eventType(job.getEventType())
                .attemptNumber(job.getAttemptNumber())
                .status(DeliveryAttempt.DeliveryStatus.SUCCESS)
                .httpStatus(result.getHttpStatus())
                .responseBody(result.getResponseBody())
                .durationMs(result.getDurationMs())
                .payload(serializePayload(job.getPayload()))
                .build());

        // XACK tells Redis: this message has been processed, remove from pending list
        ackMessage(streamName, messageId);
        log.info("Delivery SUCCESS — event {} endpoint {}", job.getEventId(), job.getEndpointId());
    }

    private void handleFailure(DeliveryJobMessage job,
                                HttpDeliveryService.DeliveryResult result,
                                String messageId) {
        boolean exhausted = job.getAttemptNumber() >= maxAttempts;

        DeliveryAttempt.DeliveryStatus status = exhausted
                ? DeliveryAttempt.DeliveryStatus.DEAD
                : DeliveryAttempt.DeliveryStatus.FAILED;

        // Calculate next retry time with exponential backoff + jitter
        LocalDateTime nextRetryAt = exhausted ? null : calculateNextRetry(job.getAttemptNumber());

        // Persist this failed attempt
        attemptRepository.save(DeliveryAttempt.builder()
                .eventId(job.getEventId())
                .endpointId(job.getEndpointId())
                .endpointUrl(job.getEndpointUrl())
                .eventType(job.getEventType())
                .attemptNumber(job.getAttemptNumber())
                .status(status)
                .httpStatus(result.getHttpStatus())
                .responseBody(result.getResponseBody())
                .errorMessage(result.getErrorMessage())
                .durationMs(result.getDurationMs())
                .nextRetryAt(nextRetryAt)
                .payload(serializePayload(job.getPayload()))
                .build());

        if (exhausted) {
            // Send to Dead Letter Queue
            sendToDlq(job, result);
            log.warn("Delivery DEAD — event {} endpoint {} exhausted {} attempts",
                    job.getEventId(), job.getEndpointId(), maxAttempts);
        } else {
            // Schedule retry
            scheduleRetry(job, nextRetryAt);
            log.warn("Delivery FAILED — event {} attempt {} → retry at {}",
                    job.getEventId(), job.getAttemptNumber(), nextRetryAt);
        }

        // Always ACK — we've handled this message (retry is a new message)
        ackMessage(streamName, messageId);
    }

    private LocalDateTime calculateNextRetry(int attemptNumber) {
        // 2^attemptNumber seconds + random jitter ±30%
        long baseDelaySeconds = (long) Math.pow(2, attemptNumber);
        long jitter = (long) (baseDelaySeconds * 0.3 * (Math.random() * 2 - 1));
        long totalSeconds = Math.max(1, baseDelaySeconds + jitter);
        return LocalDateTime.now().plusSeconds(totalSeconds);
    }

    private void scheduleRetry(DeliveryJobMessage job, LocalDateTime nextRetryAt) {
        try {
            // Build the retry job — increment attempt number
            DeliveryJobMessage retryJob = DeliveryJobMessage.builder()
                    .eventId(job.getEventId())
                    .endpointId(job.getEndpointId())
                    .endpointUrl(job.getEndpointUrl())
                    .signingSecret(job.getSigningSecret())
                    .eventType(job.getEventType())
                    .payload(job.getPayload())
                    .attemptNumber(job.getAttemptNumber() + 1)
                    .build();

            String json = objectMapper.writeValueAsString(retryJob);

            // Write to retry stream with the scheduled time embedded in the message
            redisTemplate.opsForStream().add(
                    StreamRecords.newRecord()
                            .in(retryStreamName)
                            .ofMap(Map.of(
                                    "job", json,
                                    "nextRetryAt", nextRetryAt.toString()
                            ))
            );
        } catch (Exception e) {
            log.error("Failed to schedule retry for event {}", job.getEventId(), e);
        }
    }

    private void sendToDlq(DeliveryJobMessage job,
                            HttpDeliveryService.DeliveryResult result) {
        try {
            String json = objectMapper.writeValueAsString(job);
            redisTemplate.opsForStream().add(
                    StreamRecords.newRecord()
                            .in(dlqStreamName)
                            .ofMap(Map.of(
                                    "job", json,
                                    "failureReason", result.getErrorMessage() != null
                                            ? result.getErrorMessage()
                                            : "HTTP " + result.getHttpStatus()
                            ))
            );
        } catch (Exception e) {
            log.error("Failed to write to DLQ for event {}", job.getEventId(), e);
        }
    }

    private void ackMessage(String stream, String messageId) {
        redisTemplate.opsForStream().acknowledge(stream, consumerGroup, messageId);
    }

    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}