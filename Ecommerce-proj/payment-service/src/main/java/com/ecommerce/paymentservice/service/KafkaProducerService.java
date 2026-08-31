package com.ecommerce.paymentservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class KafkaProducerService {

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private static final Logger logger = LoggerFactory.getLogger(KafkaProducerService.class);

    private String buildEvent(String eventType, String serviceSource, Map<String, Object> data) {
        try {
            Map<String, Object> event = new java.util.HashMap<>();
            event.put("eventType", eventType);
            event.put("timestamp", LocalDateTime.now().toString());
            event.put("serviceSource", serviceSource);
            event.put("data", data);
            return objectMapper.writeValueAsString(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to build Kafka event", e);
        }
    }

    public void publishPaymentSuccess(UUID orderId, UUID paymentId, java.math.BigDecimal amount) {
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("orderId", orderId.toString());
        data.put("paymentId", paymentId.toString());
        data.put("amount", amount);
        String event = buildEvent("payment.success", "payment-service", data);
        kafkaTemplate.send("ecommerce.payments", orderId.toString(), event);
        logger.info("Published payment.success event for order {}", orderId);
    }

    public void publishPaymentFailed(UUID orderId, UUID paymentId, String reason) {
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("orderId", orderId.toString());
        data.put("paymentId", paymentId.toString());
        data.put("reason", reason);
        String event = buildEvent("payment.failed", "payment-service", data);
        kafkaTemplate.send("ecommerce.payments", orderId.toString(), event);
        logger.info("Published payment.failed event for order {}", orderId);
    }
}