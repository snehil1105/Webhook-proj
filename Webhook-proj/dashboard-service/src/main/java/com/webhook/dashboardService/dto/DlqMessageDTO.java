package com.webhook.dashboardService.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class DlqMessageDTO {
    private String messageId;     // Redis stream message ID
    private String eventId;
    private String endpointId;
    private String endpointUrl;
    private String eventType;
    private String failureReason;
    private Object payload;
}