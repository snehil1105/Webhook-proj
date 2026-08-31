package com.ecommerce.productservice.controller;

import com.ecommerce.productservice.dto.ReviewRequest;
import com.ecommerce.productservice.entity.Review;
import com.ecommerce.productservice.repository.ReviewRepository;
import com.ecommerce.productservice.service.KafkaProducerService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private static final Logger logger = LoggerFactory.getLogger(ReviewController.class);

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private KafkaProducerService kafkaProducerService;

    @Value("${order-service.base-url:http://ecom-order-service:9093}")
    private String orderServiceBaseUrl;

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("No authenticated user");
        }
        return UUID.fromString(authentication.getPrincipal().toString());
    }

    @GetMapping("/public/products/{productId}/reviews")
    public ResponseEntity<List<Review>> getProductReviews(@PathVariable UUID productId) {
        List<Review> reviews = reviewRepository.findByProductId(productId);
        return ResponseEntity.ok(reviews);
    }

    @PostMapping("/public/products/{productId}/reviews")
    public ResponseEntity<?> createReview(
            @PathVariable UUID productId,
            @RequestBody ReviewRequest request,
            @RequestHeader("Authorization") String authHeader
    ) {
        UUID customerId = getCurrentUserId();

        // 1. Verify that user purchased this product and it was DELIVERED
        boolean isEligible = hasDeliveredOrderForProduct(productId, authHeader);
        if (!isEligible) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only customers with a delivered order for this product can write a review.");
        }

        // 2. Save the review
        Review review = Review.builder()
                .productId(productId)
                .customerId(customerId)
                .customerName(request.getCustomerName())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review saved = reviewRepository.save(review);

        // 3. Publish event
        try {
            kafkaProducerService.publishReviewSubmitted(
                saved.getId(),
                saved.getProductId(),
                saved.getCustomerId(),
                saved.getCustomerName(),
                saved.getRating(),
                saved.getComment()
            );
        } catch (Exception e) {
            logger.error("Failed to publish review.submitted event: {}", e.getMessage());
        }

        // 4. Invalidate Redis Caches
        try {
            redisTemplate.delete("products:" + productId);
            redisTemplate.delete("products:all");
        } catch (Exception e) {
            logger.error("Failed to invalidate product cache on review write: {}", e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    private boolean hasDeliveredOrderForProduct(UUID productId, String authHeader) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", authHeader);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            // Call ecom-order-service to inspect orders
            ResponseEntity<List> response = restTemplate.exchange(
                    orderServiceBaseUrl + "/customer/orders",
                    HttpMethod.GET,
                    entity,
                    List.class
            );

            List<Map<String, Object>> ordersList = response.getBody();
            if (ordersList == null) return false;

            for (Map<String, Object> orderMap : ordersList) {
                String status = (String) orderMap.get("status");
                if ("DELIVERED".equals(status)) {
                    List<Map<String, Object>> itemsList = (List<Map<String, Object>>) orderMap.get("items");
                    if (itemsList != null) {
                        for (Map<String, Object> itemMap : itemsList) {
                            String itemProdId = (String) itemMap.get("productId");
                            if (productId.toString().equals(itemProdId)) {
                                return true;
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Failed to query order-service for purchase verification: {}", e.getMessage());
        }
        return false;
    }
}
