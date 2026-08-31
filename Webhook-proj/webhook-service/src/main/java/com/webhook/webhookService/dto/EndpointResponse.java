package com.webhook.webhookService.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder
public class EndpointResponse {
    private UUID id;
    private String name;
    private String url;
    private String signingSecret;   // only populated on creation
    private List<String> eventTypes;
    private boolean isActive;
    private LocalDateTime createdAt;
}