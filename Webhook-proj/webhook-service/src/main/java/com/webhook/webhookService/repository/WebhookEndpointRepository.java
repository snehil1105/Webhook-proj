package com.webhook.webhookService.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.webhook.webhookService.entity.WebhookEndpoint;

public interface WebhookEndpointRepository extends JpaRepository<WebhookEndpoint, UUID> {

    List<WebhookEndpoint> findByUserIdAndIsActiveTrue(UUID userId);

    @Query("""
            SELECT e FROM WebhookEndpoint e
            JOIN e.eventTypes et
            WHERE e.isActive= true
            AND et.eventType= :eventType
            """)

    List<WebhookEndpoint> findActiveEndpointsByEventType(String eventType);

}
