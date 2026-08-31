package com.ecommerce.productservice.service;

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

    public void publishReviewSubmitted(UUID reviewId, UUID productId, UUID customerId, String customerName, int rating, String comment) {
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("reviewId", reviewId.toString());
        data.put("productId", productId.toString());
        data.put("customerId", customerId.toString());
        data.put("customerName", customerName);
        data.put("rating", rating);
        data.put("comment", comment);
        String event = buildEvent("review.submitted", "product-service", data);
        kafkaTemplate.send("ecommerce.products", productId.toString(), event);
        logger.info("Published review.submitted event for review {} on product {}", reviewId, productId);
    }

    public void publishProductPriceChanged(UUID productId, UUID retailerId, String name, double oldPrice, double newPrice) {
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("productId", productId.toString());
        data.put("retailerId", retailerId.toString());
        data.put("name", name);
        data.put("oldPrice", oldPrice);
        data.put("newPrice", newPrice);
        String event = buildEvent("product.price-changed", "product-service", data);
        kafkaTemplate.send("ecommerce.products", productId.toString(), event);
        logger.info("Published product.price-changed event for product {}", productId);
    }

    public void publishInventoryLowStock(UUID productId, UUID retailerId, String name, int currentStock, int threshold) {
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("productId", productId.toString());
        data.put("retailerId", retailerId.toString());
        data.put("name", name);
        data.put("currentStock", currentStock);
        data.put("threshold", threshold);
        String event = buildEvent("inventory.low-stock", "product-service", data);
        kafkaTemplate.send("ecommerce.products", productId.toString(), event);
        logger.info("Published inventory.low-stock event for product {}", productId);
    }

    public void publishProductOutOfStock(UUID productId, UUID retailerId, String name) {
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("productId", productId.toString());
        data.put("retailerId", retailerId.toString());
        data.put("name", name);
        String event = buildEvent("product.out-of-stock", "product-service", data);
        kafkaTemplate.send("ecommerce.products", productId.toString(), event);
        logger.info("Published product.out-of-stock event for product {}", productId);
    }
}
