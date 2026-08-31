package com.webhook.webhookService.service;

import com.webhook.webhookService.dto.CreateEndpointRequest;
import com.webhook.webhookService.dto.EndpointResponse;
import com.webhook.webhookService.entity.EndpointEventType;
import com.webhook.webhookService.entity.WebhookEndpoint;
import com.webhook.webhookService.exception.AppException;
import com.webhook.webhookService.repository.WebhookEndpointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EndpointService {

    private final WebhookEndpointRepository endpointRepository;

    @Transactional
    public EndpointResponse create(UUID userId, CreateEndpointRequest request) {
        // Generate a signing secret — this is what the receiver uses to verify HMAC
        String secret = "whsec_" + UUID.randomUUID().toString().replace("-", "");

        WebhookEndpoint endpoint = WebhookEndpoint.builder()
                .userId(userId)
                .name(request.getName())
                .url(request.getUrl())
                .secret(secret)
                .isActive(true)
                .build();

        // Attach event type subscriptions
        List<EndpointEventType> eventTypes = request.getEventTypes().stream()
                .map(et -> EndpointEventType.builder()
                        .endpoint(endpoint)
                        .eventType(et)
                        .build())
                .toList();
        endpoint.getEventTypes().addAll(eventTypes);

        endpointRepository.save(endpoint);

        return toResponse(endpoint, secret);  // secret shown only here
    }

    public List<EndpointResponse> listForUser(UUID userId) {
        return endpointRepository.findByUserIdAndIsActiveTrue(userId)
                .stream()
                .map(e -> toResponse(e, null))  // never return secret again
                .toList();
    }

    @Transactional
    public void deactivate(UUID endpointId, UUID userId) {
        WebhookEndpoint endpoint = endpointRepository.findById(endpointId)
                .orElseThrow(() -> new AppException("Endpoint not found", HttpStatus.NOT_FOUND));
        if (!endpoint.getUserId().equals(userId)) {
            throw new AppException("Forbidden", HttpStatus.FORBIDDEN);
        }
        endpoint.setActive(false);
        endpointRepository.save(endpoint);
    }

    private EndpointResponse toResponse(WebhookEndpoint endpoint, String rawSecret) {
        return EndpointResponse.builder()
                .id(endpoint.getId())
                .name(endpoint.getName())
                .url(endpoint.getUrl())
                .signingSecret(rawSecret)  // null except at creation
                .eventTypes(endpoint.getEventTypes().stream()
                        .map(EndpointEventType::getEventType).toList())
                .isActive(endpoint.isActive())
                .createdAt(endpoint.getCreatedAt())
                .build();
    }
}