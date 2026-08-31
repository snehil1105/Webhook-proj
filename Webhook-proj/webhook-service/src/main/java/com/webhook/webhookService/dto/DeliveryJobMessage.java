package com.webhook.webhookService.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DeliveryJobMessage {
    private UUID eventId;
    private UUID endpointId;
    private String endpointUrl;
    private String signingSecret;
    private String eventType;
    private Map<String, Object> payload;
    private int attemptNumber;       // starts at 1
}