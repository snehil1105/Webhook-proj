package com.ecommerce.orderservice.service;

import com.ecommerce.orderservice.dto.OrderItemRequest;
import com.ecommerce.orderservice.dto.OrderRequest;
import com.ecommerce.orderservice.dto.OrderResponse;
import com.ecommerce.orderservice.entity.Order;
import com.ecommerce.orderservice.entity.OrderItem;
import com.ecommerce.orderservice.exception.AppException;
import com.ecommerce.orderservice.repository.OrderRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import com.ecommerce.orderservice.entity.Coupon;
import com.ecommerce.orderservice.repository.CouponRepository;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private KafkaProducerService kafkaProducerService;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${product-service.base-url:http://localhost:9092}")
    private String productServiceBaseUrl;

    @Transactional
    public OrderResponse placeOrder(UUID customerId, String authHeader, OrderRequest request) {
        // 1. Validate stock and fetch product details from product-service
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (OrderItemRequest itemReq : request.getItems()) {
            ProductDetail product = fetchProduct(itemReq.getProductId(), authHeader);
            if (product.getStockQuantity() < itemReq.getQuantity()) {
                throw new AppException("Insufficient stock for product: " + product.getName(), HttpStatus.BAD_REQUEST);
            }
            OrderItem item = OrderItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(product.getPrice())
                    .build();
            orderItems.add(item);
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity())));
        }

        if (request.getCoupon() != null && !request.getCoupon().isEmpty()) {
            Optional<Coupon> couponOpt = couponRepository.findByCodeIgnoreCase(request.getCoupon());
            if (couponOpt.isPresent()) {
                BigDecimal pct = couponOpt.get().getDiscountPercent();
                if (pct.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal multiplier = BigDecimal.valueOf(100).subtract(pct)
                            .divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP);
                    total = total.multiply(multiplier);
                }
            }
        }

        // 2. Persist order
        Order order = Order.builder()
                .customerId(customerId)
                .items(serializeItems(orderItems))
                .totalAmount(total)
                .status(Order.Status.PENDING)
                .build();
        Order saved = orderRepository.save(order);

        // 3. Publish event
        kafkaProducerService.publishOrderPlaced(saved.getId(), customerId, orderItems, total);

        return mapToResponse(saved, orderItems);
    }

    @Transactional
    public OrderResponse shipOrder(UUID retailerId, UUID orderId, String authHeader) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException("Order not found", HttpStatus.NOT_FOUND));

        List<UUID> retailerProductIds = fetchRetailerProductIds(retailerId, authHeader);
        List<OrderItem> items = deserializeItems(order.getItems());
        boolean hasRetailerProduct = items.stream()
                .anyMatch(item -> retailerProductIds.contains(item.getProductId()));
        if (!hasRetailerProduct) {
            throw new AppException("You cannot ship an order that does not contain your products", HttpStatus.FORBIDDEN);
        }

        if (order.getStatus() == Order.Status.SHIPPED || order.getStatus() == Order.Status.DELIVERED) {
            throw new AppException("Order already shipped", HttpStatus.BAD_REQUEST);
        }
        order.setStatus(Order.Status.SHIPPED);
        Order saved = orderRepository.save(order);

        String estimatedDelivery = LocalDateTime.now().plus(5, ChronoUnit.DAYS).toString();
        kafkaProducerService.publishOrderShipped(saved.getId(), saved.getCustomerId(), estimatedDelivery);

        return mapToResponse(saved, items);
    }

    @Transactional
    public void cancelOrder(UUID orderId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException("Order not found", HttpStatus.NOT_FOUND));
        order.setStatus(Order.Status.CANCELLED);
        orderRepository.save(order);
        kafkaProducerService.publishOrderCancelled(orderId, order.getCustomerId(), reason);
    }

    @Transactional
    public void returnOrder(UUID orderId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException("Order not found", HttpStatus.NOT_FOUND));
        if (order.getStatus() != Order.Status.DELIVERED) {
            throw new AppException("Only delivered orders can be returned", HttpStatus.BAD_REQUEST);
        }
        order.setStatus(Order.Status.RETURN_REQUESTED);
        Order saved = orderRepository.save(order);
        kafkaProducerService.publishOrderReturnRequested(orderId, saved.getCustomerId(), reason);
    }

    public List<OrderResponse> getCustomerOrders(UUID customerId) {
        return orderRepository.findByCustomerId(customerId).stream()
                .map(o -> mapToResponse(o, deserializeItems(o.getItems())))
                .toList();
    }

    public OrderResponse getOrderById(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException("Order not found", HttpStatus.NOT_FOUND));
        return mapToResponse(order, deserializeItems(order.getItems()));
    }

    public List<OrderResponse> getIncomingOrdersForRetailer(UUID retailerId, String authHeader) {
        List<UUID> retailerProductIds = fetchRetailerProductIds(retailerId, authHeader);
        return orderRepository.findAll().stream()
                .map(o -> {
                    List<OrderItem> items = deserializeItems(o.getItems());
                    boolean hasRetailerProduct = items.stream()
                            .anyMatch(item -> retailerProductIds.contains(item.getProductId()));
                    if (hasRetailerProduct) {
                        return mapToResponse(o, items);
                    }
                    return null;
                })
                .filter(o -> o != null)
                .toList();
    }

    private List<UUID> fetchRetailerProductIds(UUID retailerId, String authHeader) {
        try {
            HttpHeaders headers = new HttpHeaders();
            if (authHeader != null) {
                headers.set("Authorization", authHeader);
            }
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<List> response = restTemplate.exchange(
                    productServiceBaseUrl + "/business/products/mine",
                    HttpMethod.GET, entity, List.class);
            List<Map<String, Object>> body = response.getBody();
            if (body == null) return List.of();
            return body.stream()
                    .map(m -> UUID.fromString(m.get("id").toString()))
                    .toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    private ProductDetail fetchProduct(UUID productId, String authHeader) {
        try {
            HttpHeaders headers = new HttpHeaders();
            if (authHeader != null) {
                headers.set("Authorization", authHeader);
            }
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    productServiceBaseUrl + "/public/products/" + productId,
                    HttpMethod.GET, entity, Map.class);
            Map<String, Object> body = response.getBody();
            ProductDetail detail = new ProductDetail();
            detail.setId(UUID.fromString(body.get("id").toString()));
            detail.setName((String) body.get("name"));
            detail.setPrice(new BigDecimal(body.get("price").toString()));
            detail.setStockQuantity(((Number) body.get("stockQuantity")).intValue());
            return detail;
        } catch (Exception e) {
            throw new AppException("Failed to fetch product " + productId + ": " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    private String serializeItems(List<OrderItem> items) {
        try {
            return objectMapper.writeValueAsString(items);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize order items", e);
        }
    }

    private List<OrderItem> deserializeItems(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<OrderItem>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize order items", e);
        }
    }

    private OrderResponse mapToResponse(Order order, List<OrderItem> items) {
        List<OrderResponse.OrderItem> itemDtos = items.stream().map(i ->
                OrderResponse.OrderItem.builder()
                        .productId(i.getProductId())
                        .productName(i.getProductName())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .build()).toList();
        return OrderResponse.builder()
                .id(order.getId())
                .customerId(order.getCustomerId())
                .items(itemDtos)
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private static class ProductDetail {
        private UUID id;
        private String name;
        private BigDecimal price;
        private int stockQuantity;

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public int getStockQuantity() { return stockQuantity; }
        public void setStockQuantity(int stockQuantity) { this.stockQuantity = stockQuantity; }
    }
}