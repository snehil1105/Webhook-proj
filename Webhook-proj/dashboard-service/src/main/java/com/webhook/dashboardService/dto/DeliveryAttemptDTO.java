package com.webhook.dashboardService.dto;

import com.webhook.dashboardService.entity.DeliveryAttempt;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder
public class DeliveryAttemptDTO {
    private UUID id;
    private UUID eventId;
    private UUID endpointId;
    private String endpointUrl;
    private String eventType;
    private int attemptNumber;
    private String status;
    private Integer httpStatus;
    private String responseBody;
    private String errorMessage;
    private Integer durationMs;
    private LocalDateTime nextRetryAt;
    private LocalDateTime createdAt;
    private Object payload;

    private static final com.fasterxml.jackson.databind.ObjectMapper mapper =
            new com.fasterxml.jackson.databind.ObjectMapper();

    public static DeliveryAttemptDTO from(DeliveryAttempt a) {
        Object parsedPayload = null;
        if (a.getPayload() != null && !a.getPayload().isBlank()) {
            try {
                parsedPayload = mapper.readValue(a.getPayload(), Object.class);
            } catch (Exception e) {
                parsedPayload = a.getPayload();
            }
        }

        return DeliveryAttemptDTO.builder()
                .id(a.getId())
                .eventId(a.getEventId())
                .endpointId(a.getEndpointId())
                .endpointUrl(a.getEndpointUrl())
                .eventType(a.getEventType())
                .attemptNumber(a.getAttemptNumber())
                .status(a.getStatus().name())
                .httpStatus(a.getHttpStatus())
                .responseBody(a.getResponseBody())
                .errorMessage(a.getErrorMessage())
                .durationMs(a.getDurationMs())
                .nextRetryAt(a.getNextRetryAt())
                .createdAt(a.getCreatedAt())
                .payload(parsedPayload)
                .build();
    }
}