package com.webhook.webhookService.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.util.Map;

@Data
public class PublishEventRequest {

    @NotBlank
    @Pattern(regexp = "^[a-z]+\\.[a-z_-]+$", message = "Event type must be like 'order.shipped'")
    private String eventType;

    @NotNull
    @com.fasterxml.jackson.annotation.JsonAlias({"data", "payload"})
    private Map<String, Object> payload;
}