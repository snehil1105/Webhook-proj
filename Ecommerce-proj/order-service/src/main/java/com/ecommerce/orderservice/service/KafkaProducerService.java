package com.ecommerce.orderservice.service;

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

    public void publishOrderPlaced(UUID orderId, UUID customerId, Object items, java.math.BigDecimal totalAmount) {
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("orderId", orderId.toString());
        data.put("customerId", customerId.toString());
        data.put("items", items);
        data.put("totalAmount", totalAmount);
        String event = buildEvent("order.placed", "order-service", data);
        kafkaTemplate.send("ecommerce.orders", orderId.toString(), event);
        logger.info("Published order.placed event for order {}", orderId);
    }

    public void publishOrderShipped(UUID orderId, UUID customerId, String estimatedDelivery) {
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("orderId", orderId.toString());
        data.put("customerId", customerId.toString());
        data.put("estimatedDelivery", estimatedDelivery);
        String event = buildEvent("order.shipped", "order-service", data);
        kafkaTemplate.send("ecommerce.orders", orderId.toString(), event);
        logger.info("Published order.shipped event for order {}", orderId);
    }

    public void publishOrderCancelled(UUID orderId, UUID customerId, String reason) {
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("orderId", orderId.toString());
        data.put("customerId", customerId.toString());
        data.put("reason", reason);
        String event = buildEvent("order.cancelled", "order-service", data);
        kafkaTemplate.send("ecommerce.orders", orderId.toString(), event);
        logger.info("Published order.cancelled event for order {}", orderId);
    }

    public void publishOrderReturnRequested(UUID orderId, UUID customerId, String reason) {
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("orderId", orderId.toString());
        data.put("customerId", customerId.toString());
        data.put("reason", reason);
        String event = buildEvent("order.returned", "order-service", data);
        kafkaTemplate.send("ecommerce.orders", orderId.toString(), event);
        logger.info("Published order.returned event for order {}", orderId);
    }
}