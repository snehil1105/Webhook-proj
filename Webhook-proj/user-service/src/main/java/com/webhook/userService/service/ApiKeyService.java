package com.webhook.userService.service;

import com.webhook.userService.dto.ApiKeyCreateRequest;
import com.webhook.userService.dto.ApiKeyResponse;
import com.webhook.userService.entity.ApiKey;
import com.webhook.userService.entity.User;
import com.webhook.userService.exception.AppException;
import com.webhook.userService.Repository.ApiKeyRepository;
import com.webhook.userService.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final UserRepository userRepository;

    public ApiKeyResponse createKey(UUID userId, ApiKeyCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        String rawKey = "wh_" + UUID.randomUUID().toString().replace("-", "");
        String prefix = rawKey.substring(0, 11);
        String hash = sha256(rawKey);

        ApiKey apiKey = ApiKey.builder()
                .user(user)
                .keyPrefix(prefix)
                .keyHash(hash)
                .name(request.getName())
                .isActive(true)
                .build();

        apiKeyRepository.save(apiKey);

        return ApiKeyResponse.builder()
                .id(apiKey.getId())
                .name(apiKey.getName())
                .keyPrefix(prefix)
                .rawKey(rawKey)
                .createdAt(apiKey.getCreatedAt())
                .build();
    }

    public List<ApiKeyResponse> listKeys(UUID userId) {
        return apiKeyRepository.findByUserIdAndIsActiveTrue(userId).stream()
                .map(k -> ApiKeyResponse.builder()
                        .id(k.getId())
                        .name(k.getName())
                        .keyPrefix(k.getKeyPrefix())
                        .rawKey(null)
                        .createdAt(k.getCreatedAt())
                        .build())
                .toList();
    }

    public void revokeKey(@NonNull UUID keyId, UUID userId) {
        ApiKey key = apiKeyRepository.findById(keyId)
                .orElseThrow(() -> new AppException("Key not found", HttpStatus.NOT_FOUND));
        if (!key.getUser().getId().equals(userId)) {
            throw new AppException("Forbidden", HttpStatus.FORBIDDEN);
        }
        key.setActive(false);
        apiKeyRepository.save(key);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}