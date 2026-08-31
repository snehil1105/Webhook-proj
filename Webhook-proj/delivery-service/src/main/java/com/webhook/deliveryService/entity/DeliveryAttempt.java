package com.webhook.deliveryService.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "delivery_attempts",
       indexes = {
           @Index(name = "idx_delivery_event_id", columnList = "event_id"),
           @Index(name = "idx_delivery_endpoint_id", columnList = "endpoint_id"),
           @Index(name = "idx_delivery_status", columnList = "status")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeliveryAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID eventId;

    @Column(nullable = false)
    private UUID endpointId;

    @Column(nullable = false)
    private String endpointUrl;

    private String eventType;

    @Column(nullable = false)
    private int attemptNumber;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DeliveryStatus status;

    private Integer httpStatus;        // null on timeout/connection error

    @Column(length = 1000)
    private String responseBody;

    @Column(length = 500)
    private String errorMessage;

    private Integer durationMs;

    @Column(columnDefinition = "TEXT")
    private String payload;

    private LocalDateTime nextRetryAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum DeliveryStatus {
        PENDING, SUCCESS, FAILED, DEAD
    }
}