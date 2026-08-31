package com.webhook.dashboardService.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.webhook.dashboardService.dto.*;
import com.webhook.dashboardService.entity.DeliveryAttempt;
import com.webhook.dashboardService.repository.DeliveryAttemptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.stream.*;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DeliveryAttemptRepository attemptRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.redis.stream-name}")     private String streamName;
    @Value("${app.redis.dlq-stream-name}") private String dlqStreamName;

    // ─── Delivery Logs ──────────────────────────────────────────────────────

    public List<DeliveryAttemptDTO> getDeliveriesForEvent(UUID eventId) {
        return attemptRepository.findByEventIdOrderByAttemptNumberAsc(eventId)
                .stream()
                .map(DeliveryAttemptDTO::from)
                .toList();
    }

    public List<DeliveryAttemptDTO> getDeliveriesForEndpoint(UUID endpointId, String status) {
        List<DeliveryAttempt> results;

        if (status != null && !status.isBlank()) {
            DeliveryAttempt.DeliveryStatus statusEnum =
                    DeliveryAttempt.DeliveryStatus.valueOf(status.toUpperCase());
            results = attemptRepository
                    .findByEndpointIdAndStatusOrderByCreatedAtDesc(endpointId, statusEnum);
        } else {
            results = attemptRepository
                    .findByEndpointIdOrderByCreatedAtDesc(endpointId);
        }

        return results.stream().map(DeliveryAttemptDTO::from).toList();
    }

    // ─── DLQ ────────────────────────────────────────────────────────────────

    public List<DlqMessageDTO> getDlqMessages() {
        try {
            List<MapRecord<String, Object, Object>> records =
                    redisTemplate.opsForStream().read(
                            StreamReadOptions.empty().count(100),
                            StreamOffset.fromStart(dlqStreamName)
                    );

            if (records == null) return List.of();

            return records.stream()
                    .map(this::toDlqDTO)
                    .filter(Objects::nonNull)
                    .toList();

        } catch (Exception e) {
            log.warn("DLQ stream '{}' is empty or does not exist yet", dlqStreamName);
            return List.of();
        }
    }

    // ─── Replay ─────────────────────────────────────────────────────────────

    public ReplayResponse replay(String messageId) {
        // 1. Find the message in the DLQ
        List<MapRecord<String, Object, Object>> records =
                redisTemplate.opsForStream().read(
                        StreamReadOptions.empty().count(100),
                        StreamOffset.fromStart(dlqStreamName)
                );

        if (records == null || records.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "DLQ is empty");
        }

        MapRecord<String, Object, Object> target = records.stream()
                .filter(r -> r.getId().getValue().equals(messageId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Message not found in DLQ: " + messageId));

        // 2. Parse the job and reset attempt number to 1
        try {
            String jobJson = (String) target.getValue().get("job");

            @SuppressWarnings("unchecked")
            Map<String, Object> jobMap = objectMapper.readValue(jobJson, Map.class);
            jobMap.put("attemptNumber", 1);   // fresh start

            String replayJson = objectMapper.writeValueAsString(jobMap);

            // 3. Re-publish to main delivery stream
            redisTemplate.opsForStream().add(
                    StreamRecords.newRecord()
                            .in(streamName)
                            .ofMap(Map.of("job", replayJson))
            );

            // 4. Remove from DLQ — it's been replayed
            redisTemplate.opsForStream().delete(dlqStreamName, messageId);

            log.info("Replayed DLQ message {} back to main stream", messageId);

            return new ReplayResponse("queued", "Event re-queued for delivery", messageId);

        } catch (Exception e) {
            log.error("Failed to replay message {}", messageId, e);
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Replay failed: " + e.getMessage());
        }
    }

    // ─── Stats ───────────────────────────────────────────────────────────────

    public StatsDTO getStats() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();

        long totalEvents = attemptRepository.countDistinctEventsSince(startOfDay);
        long succeeded   = attemptRepository.countByStatusSince(
                DeliveryAttempt.DeliveryStatus.SUCCESS, startOfDay);
        long failed      = attemptRepository.countByStatusSince(
                DeliveryAttempt.DeliveryStatus.FAILED, startOfDay);
        long dead        = attemptRepository.countByStatusSince(
                DeliveryAttempt.DeliveryStatus.DEAD, startOfDay);

        long dlqSize = getDlqSize();

        double successRate = totalEvents == 0 ? 0.0
                : Math.round((succeeded * 100.0 / totalEvents) * 10.0) / 10.0;

        return StatsDTO.builder()
                .totalEventsToday(totalEvents)
                .successfulDeliveriesToday(succeeded)
                .failedDeliveriesToday(failed)
                .deadDeliveriesToday(dead)
                .dlqSize(dlqSize)
                .successRatePercent(successRate)
                .build();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private long getDlqSize() {
        try {
            Long size = redisTemplate.opsForStream().size(dlqStreamName);
            return size != null ? size : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    private DlqMessageDTO toDlqDTO(MapRecord<String, Object, Object> record) {
        try {
            String jobJson = (String) record.getValue().get("job");
            String failureReason = (String) record.getValue().get("failureReason");

            @SuppressWarnings("unchecked")
            Map<String, Object> job = objectMapper.readValue(jobJson, Map.class);

            return DlqMessageDTO.builder()
                    .messageId(record.getId().getValue())
                    .eventId(String.valueOf(job.get("eventId")))
                    .endpointId(String.valueOf(job.get("endpointId")))
                    .endpointUrl(String.valueOf(job.get("endpointUrl")))
                    .eventType(String.valueOf(job.get("eventType")))
                    .payload(job.get("payload"))
                    .failureReason(failureReason)
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse DLQ record {}", record.getId(), e);
            return null;
        }
    }
}