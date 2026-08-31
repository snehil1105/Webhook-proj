package com.webhook.dashboardService.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "delivery_attempts")
@Getter @NoArgsConstructor
public class DeliveryAttempt {

    @Id
    private UUID id;
    private UUID eventId;
    private UUID endpointId;
    private String endpointUrl;
    private String eventType;
    private int attemptNumber;

    @Enumerated(EnumType.STRING)
    private DeliveryStatus status;

    private Integer httpStatus;
    private String responseBody;
    private String errorMessage;
    private Integer durationMs;

    @Column(columnDefinition = "TEXT")
    private String payload;

    private LocalDateTime nextRetryAt;
    private LocalDateTime createdAt;

    public enum DeliveryStatus {
        PENDING, SUCCESS, FAILED, DEAD
    }
}