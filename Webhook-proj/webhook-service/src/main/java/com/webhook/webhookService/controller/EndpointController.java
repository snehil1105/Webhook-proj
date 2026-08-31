package com.webhook.webhookService.controller;

import com.webhook.webhookService.dto.CreateEndpointRequest;
import com.webhook.webhookService.dto.EndpointResponse;
import com.webhook.webhookService.service.EndpointService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/endpoints")
@RequiredArgsConstructor
public class EndpointController {

    private final EndpointService endpointService;

    @PostMapping
    public ResponseEntity<EndpointResponse> create(@Valid @RequestBody CreateEndpointRequest request,
                                                    Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(endpointService.create(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<EndpointResponse>> list(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(endpointService.listForUser(userId));
    }

    @DeleteMapping("/{endpointId}")
    public ResponseEntity<Void> deactivate(@PathVariable UUID endpointId, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        endpointService.deactivate(endpointId, userId);
        return ResponseEntity.noContent().build();
    }
}