package com.ecommerce.inventoryservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class InventoryConsumerService {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${product-service.base-url:http://localhost:9092}")
    private String productServiceBaseUrl;

    private static final Logger logger = LoggerFactory.getLogger(InventoryConsumerService.class);

    @KafkaListener(topics = "ecommerce.orders", groupId = "inventory-service-group")
    public void consumeOrderEvents(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            String eventType = root.get("eventType").asText();
            JsonNode data = root.get("data");

            switch (eventType) {
                case "order.placed":
                    adjustStock(data, false);
                    break;
                case "order.cancelled":
                    adjustStock(data, true);
                    break;
                default:
                    logger.debug("Ignoring event type: {}", eventType);
            }
        } catch (Exception e) {
            logger.error("Failed to process inventory event: {}", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private void adjustStock(JsonNode data, boolean restore) {
        JsonNode itemsNode = data.get("items");
        if (itemsNode == null || !itemsNode.isArray()) {
            logger.warn("No items found in order event");
            return;
        }
        for (JsonNode item : itemsNode) {
            String productId = item.get("productId").asText();
            int quantity = item.get("quantity").asInt();
            int delta = restore ? quantity : -quantity;
            updateProductStock(productId, delta);
        }
    }

    private void updateProductStock(String productId, int delta) {
        try {
            // Fetch current stock, then update. Uses the stock endpoint.
            String url = productServiceBaseUrl + "/public/products/" + productId;
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> body = response.getBody();
            if (body == null) return;
            int currentStock = ((Number) body.get("stockQuantity")).intValue();
            int newStock = currentStock + delta;

            String updateUrl = productServiceBaseUrl + "/business/products/" + productId + "/stock?stockQuantity=" + newStock;
            HttpHeaders headers = new HttpHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            restTemplate.exchange(updateUrl, HttpMethod.PUT, entity, Void.class);
            logger.info("Updated stock for product {} to {}", productId, newStock);
        } catch (Exception e) {
            logger.error("Failed to update stock for product {}: {}", productId, e.getMessage());
        }
    }
}