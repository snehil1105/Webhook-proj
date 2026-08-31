package com.webhook.dashboardService.repository;

import com.webhook.dashboardService.entity.DeliveryAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface DeliveryAttemptRepository extends JpaRepository<DeliveryAttempt, UUID> {

    List<DeliveryAttempt> findByEventIdOrderByAttemptNumberAsc(UUID eventId);

    List<DeliveryAttempt> findByEndpointIdOrderByCreatedAtDesc(UUID endpointId);

    List<DeliveryAttempt> findByEndpointIdAndStatusOrderByCreatedAtDesc(
            UUID endpointId, DeliveryAttempt.DeliveryStatus status);

    @Query("""
        SELECT COUNT(a) FROM DeliveryAttempt a
        WHERE a.status = :status
        AND a.createdAt >= :since
        """)
    long countByStatusSince(DeliveryAttempt.DeliveryStatus status, LocalDateTime since);

    @Query("""
        SELECT COUNT(DISTINCT a.eventId) FROM DeliveryAttempt a
        WHERE a.createdAt >= :since
        """)
    long countDistinctEventsSince(LocalDateTime since);
}