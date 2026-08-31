package com.webhook.webhookService.entity;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name= "endpoint_event_types", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"endpoint_id", "event_type"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EndpointEventType {

    @Id
    @GeneratedValue(strategy= GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "endpoint_id", nullable = false)
    private WebhookEndpoint endpoint;

    @Column(nullable = false)
    private String eventType;

}
