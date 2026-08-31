package com.webhook.dashboardService.controller;

import com.webhook.dashboardService.dto.*;
import com.webhook.dashboardService.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    // All delivery attempts for a specific event — shows full retry history
    @GetMapping("/events/{eventId}/deliveries")
    public ResponseEntity<List<DeliveryAttemptDTO>> getEventDeliveries(
            @PathVariable UUID eventId,
            Authentication auth) {
        return ResponseEntity.ok(dashboardService.getDeliveriesForEvent(eventId));
    }

    // All deliveries for a specific endpoint — supports ?status=FAILED filtering
    @GetMapping("/endpoints/{endpointId}/deliveries")
    public ResponseEntity<List<DeliveryAttemptDTO>> getEndpointDeliveries(
            @PathVariable UUID endpointId,
            @RequestParam(required = false) String status,
            Authentication auth) {
        return ResponseEntity.ok(
                dashboardService.getDeliveriesForEndpoint(endpointId, status));
    }

    // Dead letter queue contents
    @GetMapping("/dlq")
    public ResponseEntity<List<DlqMessageDTO>> getDlq(Authentication auth) {
        return ResponseEntity.ok(dashboardService.getDlqMessages());
    }

    // Replay a dead message — the demo-worthy endpoint
    @PostMapping("/dlq/{messageId}/replay")
    public ResponseEntity<ReplayResponse> replay(
            @PathVariable String messageId,
            Authentication auth) {
        return ResponseEntity.accepted()
                .body(dashboardService.replay(messageId));
    }

    // Today's stats at a glance
    @GetMapping("/stats")
    public ResponseEntity<StatsDTO> getStats(Authentication auth) {
        return ResponseEntity.ok(dashboardService.getStats());
    }
}