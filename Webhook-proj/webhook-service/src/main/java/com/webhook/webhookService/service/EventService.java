package com.webhook.webhookService.service;

import com.webhook.webhookService.dto.DeliveryJobMessage;
import com.webhook.webhookService.dto.PublishEventRequest;
import com.webhook.webhookService.entity.WebhookEndpoint;
import com.webhook.webhookService.entity.WebhookEvent;
import com.webhook.webhookService.repository.WebhookEndpointRepository;
import com.webhook.webhookService.repository.WebhookEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventService {

    private final WebhookEventRepository eventRepository;
    private final WebhookEndpointRepository endpointRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.redis.stream-name}")
    private String streamName;

    @Transactional
    public UUID publishEvent(UUID userId, PublishEventRequest request) {
        // 1. Persist the event
        WebhookEvent event = WebhookEvent.builder()
                .userId(userId)
                .eventType(request.getEventType())
                .payload(request.getPayload())
                .build();
        eventRepository.save(event);

        // 2. Find every active endpoint subscribed to this event type
        List<WebhookEndpoint> subscribers =
                endpointRepository.findActiveEndpointsByEventType(request.getEventType());

        log.info("Event {} of type '{}' matched {} endpoints",
                event.getId(), request.getEventType(), subscribers.size());

        // 3. For each subscriber, push one delivery job into Redis Streams
        for (WebhookEndpoint endpoint : subscribers) {
            pushToStream(event, endpoint);
        }

        return event.getId();
    }

    private void pushToStream(WebhookEvent event, WebhookEndpoint endpoint) {
        try {
            DeliveryJobMessage message = DeliveryJobMessage.builder()
                    .eventId(event.getId())
                    .endpointId(endpoint.getId())
                    .endpointUrl(endpoint.getUrl())
                    .signingSecret(endpoint.getSecret())
                    .eventType(event.getEventType())
                    .payload(event.getPayload())
                    .attemptNumber(1)
                    .build();

            String json = objectMapper.writeValueAsString(message);

            // Redis Streams message is a Map<String, String>
            MapRecord<String, String, String> record = StreamRecords
                    .newRecord()
                    .in(streamName)
                    .ofMap(Map.of("job", json));

            redisTemplate.opsForStream().add(record);

            log.info("Queued delivery job → endpoint {} for event {}",
                    endpoint.getId(), event.getId());

        } catch (JsonProcessingException e) {
            log.error("Failed to serialize delivery job for endpoint {}", endpoint.getId(), e);

        }
    }
}
