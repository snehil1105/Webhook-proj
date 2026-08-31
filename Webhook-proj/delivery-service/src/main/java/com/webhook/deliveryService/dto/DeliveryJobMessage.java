package com.webhook.deliveryService.dto;

import lombok.*;
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
    private int attemptNumber;
}