package com.webhook.userService.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApiKeyResponse {

    private UUID id;
    private String name;
    private String keyPrefix;
    private String rawKey;
    private LocalDateTime createdAt;
}
