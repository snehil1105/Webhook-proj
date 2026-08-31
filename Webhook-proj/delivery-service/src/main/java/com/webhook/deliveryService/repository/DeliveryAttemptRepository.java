package com.webhook.deliveryService.repository;

import com.webhook.deliveryService.entity.DeliveryAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DeliveryAttemptRepository extends JpaRepository<DeliveryAttempt, UUID> {
    List<DeliveryAttempt> findByEventIdOrderByAttemptNumberAsc(UUID eventId);
    List<DeliveryAttempt> findByEndpointIdOrderByCreatedAtDesc(UUID endpointId);
    int countByEventIdAndStatus(UUID eventId, DeliveryAttempt.DeliveryStatus status);
}