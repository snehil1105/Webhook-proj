package com.webhook.deliveryService.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.webhook.deliveryService.dto.DeliveryJobMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class HttpDeliveryService {

    private final HttpClient httpClient;
    private final HmacSigningService hmacSigningService;
    private final ObjectMapper objectMapper;

    @Value("${app.delivery.timeout-ms}")
    private int timeoutMs;

    public DeliveryResult deliver(DeliveryJobMessage job) {
        long startTime = System.currentTimeMillis();

        try {
            String payloadJson = objectMapper.writeValueAsString(job.getPayload());

            // Sign the raw payload JSON
            String signature = hmacSigningService.sign(job.getSigningSecret(), payloadJson);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(job.getEndpointUrl()))
                    .timeout(Duration.ofMillis(timeoutMs))
                    .header("Content-Type", "application/json")
                    .header("X-Webhook-Signature", signature)
                    .header("X-Webhook-Event-Type", job.getEventType())
                    .header("X-Webhook-Event-Id", job.getEventId().toString())
                    .header("X-Webhook-Attempt", String.valueOf(job.getAttemptNumber()))
                    .POST(HttpRequest.BodyPublishers.ofString(payloadJson))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request, HttpResponse.BodyHandlers.ofString());

            long duration = System.currentTimeMillis() - startTime;

            boolean success = response.statusCode() >= 200 && response.statusCode() < 300;

            log.info("Delivery attempt {} for event {} → {} {} ({}ms)",
                    job.getAttemptNumber(), job.getEventId(),
                    job.getEndpointUrl(), response.statusCode(), duration);

            return DeliveryResult.builder()
                    .success(success)
                    .httpStatus(response.statusCode())
                    .responseBody(truncate(response.body(), 1000))
                    .durationMs((int) duration)
                    .build();

        } catch (java.net.http.HttpTimeoutException e) {
            long duration = System.currentTimeMillis() - startTime;
            log.warn("Delivery timeout for event {} → {} ({}ms)",
                    job.getEventId(), job.getEndpointUrl(), duration);
            return DeliveryResult.builder()
                    .success(false)
                    .errorMessage("Timeout after " + duration + "ms")
                    .durationMs((int) duration)
                    .build();

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Delivery error for event {} → {}: {}",
                    job.getEventId(), job.getEndpointUrl(), e.getMessage());
            return DeliveryResult.builder()
                    .success(false)
                    .errorMessage(e.getClass().getSimpleName() + ": " + e.getMessage())
                    .durationMs((int) duration)
                    .build();
        }
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return null;
        return s.length() <= maxLen ? s : s.substring(0, maxLen) + "...[truncated]";
    }

    // Simple result object — not a DB entity, just carries the HTTP call outcome
    @lombok.Data @lombok.Builder
    public static class DeliveryResult {
        private boolean success;
        private Integer httpStatus;
        private String responseBody;
        private String errorMessage;
        private int durationMs;
    }
}