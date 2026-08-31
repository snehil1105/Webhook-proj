package com.ecommerce.webhookbridgeservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class WebhookBridgeService {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${app.webhook-platform.base-url:http://localhost:8085}")
    private String webhookPlatformBaseUrl;

    @Value("${app.webhook-platform.jwt-token:FILL_THIS_AFTER_LOGGING_INTO_WEBHOOK_PLATFORM}")
    private String jwtToken;

    private static final Logger logger = LoggerFactory.getLogger(WebhookBridgeService.class);

    @KafkaListener(topics = {"ecommerce.orders", "ecommerce.payments", "ecommerce.products"}, groupId = "webhook-bridge-service-group")
    public void consumeEvents(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            String eventType = root.get("eventType").asText();
            JsonNode data = root.get("data");

            String platformEventType = mapToPlatformEventType(eventType);
            if (platformEventType == null) {
                logger.debug("No mapping for event type: {}", eventType);
                return;
            }

            forwardToWebhookPlatform(platformEventType, data);
        } catch (Exception e) {
            logger.error("Failed to forward event to webhook platform: {}", e.getMessage());
        }
    }

    private String mapToPlatformEventType(String eventType) {
        return switch (eventType) {
            case "order.placed" -> "order.placed";
            case "order.shipped" -> "order.shipped";
            case "order.cancelled" -> "order.cancelled";
            case "order.returned" -> "return.requested";
            case "payment.success" -> "payment.success";
            case "payment.failed" -> "payment.failed";
            case "review.submitted" -> "review.submitted";
            case "product.price-changed" -> "product.price-changed";
            case "inventory.low-stock" -> "inventory.low-stock";
            case "product.out-of-stock" -> "product.out-of-stock";
            default -> null;
        };
    }

    private void forwardToWebhookPlatform(String eventType, JsonNode data) {
        try {
            String url = webhookPlatformBaseUrl + "/api/events";

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + jwtToken);
            headers.set("Content-Type", "application/json");

            Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("eventType", eventType);
            payload.put("data", data);

            String body = objectMapper.writeValueAsString(payload);
            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            logger.info("Forwarded event {} to webhook platform. Status: {}", eventType, response.getStatusCode());
        } catch (Exception e) {
            logger.error("Failed to call webhook platform for event {}: {}", eventType, e.getMessage());
        }
    }
}