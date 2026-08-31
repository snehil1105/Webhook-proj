package com.ecommerce.orderservice.service;

import com.ecommerce.orderservice.entity.Order;
import com.ecommerce.orderservice.repository.OrderRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class OrderConsumerService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private static final Logger logger = LoggerFactory.getLogger(OrderConsumerService.class);

    @KafkaListener(topics = "ecommerce.payments", groupId = "order-service-group")
    @Transactional
    public void consumePaymentEvents(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            String eventType = root.get("eventType").asText();
            JsonNode data = root.get("data");

            if ("payment.success".equals(eventType)) {
                UUID orderId = UUID.fromString(data.get("orderId").asText());
                Order order = orderRepository.findById(orderId).orElse(null);
                if (order != null && order.getStatus() == Order.Status.PENDING) {
                    order.setStatus(Order.Status.CONFIRMED);
                    orderRepository.save(order);
                    logger.info("Order {} status updated to CONFIRMED following payment success event", orderId);
                }
            }
        } catch (Exception e) {
            logger.error("Failed to process payment event: {}", e.getMessage());
        }
    }
}
