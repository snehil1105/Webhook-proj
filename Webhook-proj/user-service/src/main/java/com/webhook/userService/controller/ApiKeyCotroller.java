package com.webhook.userService.controller;

import com.webhook.userService.dto.ApiKeyCreateRequest;
import com.webhook.userService.dto.ApiKeyResponse;
import com.webhook.userService.service.ApiKeyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/keys")
@RequiredArgsConstructor
public class ApiKeyCotroller {

    private final ApiKeyService apiKeyService;

    @PostMapping
    public ResponseEntity<ApiKeyResponse> create(@Valid @RequestBody ApiKeyCreateRequest request,
                                                  Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(apiKeyService.createKey(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<ApiKeyResponse>> list(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(apiKeyService.listKeys(userId));
    }

    @DeleteMapping("/{keyId}")
    public ResponseEntity<Void> revoke(@PathVariable UUID keyId, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        apiKeyService.revokeKey(keyId, userId);
        return ResponseEntity.noContent().build();
    }
}