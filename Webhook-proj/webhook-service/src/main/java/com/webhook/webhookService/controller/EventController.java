package com.webhook.webhookService.controller;

import com.webhook.webhookService.dto.PublishEventRequest;
import com.webhook.webhookService.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> publish(@Valid @RequestBody PublishEventRequest request,
                                                        Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        UUID eventId = eventService.publishEvent(userId, request);
        return ResponseEntity.accepted().body(Map.of(
                "eventId", eventId,
                "status", "queued",
                "message", "Event accepted and queued for delivery"
        ));
    }
}