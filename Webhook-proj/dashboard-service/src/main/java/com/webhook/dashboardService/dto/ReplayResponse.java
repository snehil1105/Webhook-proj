package com.webhook.dashboardService.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class ReplayResponse {
    private String status;
    private String message;
    private String originalMessageId;
}