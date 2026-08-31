package com.webhook.dashboardService.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class StatsDTO {
    private long totalEventsToday;
    private long successfulDeliveriesToday;
    private long failedDeliveriesToday;
    private long deadDeliveriesToday;
    private long dlqSize;
    private double successRatePercent;
}