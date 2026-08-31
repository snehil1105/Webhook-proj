package com.webhook.webhookService.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name= "webhook_endpoints")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WebhookEndpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private String secret;

    @Column(nullable = false)
    private boolean isActive;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @OneToMany(mappedBy= "endpoint", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EndpointEventType> eventTypes= new ArrayList<>();
}   
