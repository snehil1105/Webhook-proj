package com.ecommerce.orderservice.controller;

import com.ecommerce.orderservice.dto.OrderRequest;
import com.ecommerce.orderservice.dto.OrderResponse;
import com.ecommerce.orderservice.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.ecommerce.orderservice.entity.Coupon;
import com.ecommerce.orderservice.repository.CouponRepository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private CouponRepository couponRepository;

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("No authenticated user");
        }
        return UUID.fromString(authentication.getPrincipal().toString());
    }

    private String getAuthHeader() {
        org.springframework.web.context.request.ServletRequestAttributes attrs =
                (org.springframework.web.context.request.ServletRequestAttributes)
                        org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
        if (attrs == null) return null;
        return attrs.getRequest().getHeader("Authorization");
    }

    // CUSTOMER endpoints
    @PostMapping("/customer/orders")
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody OrderRequest request) {
        UUID customerId = getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.placeOrder(customerId, getAuthHeader(), request));
    }

    @GetMapping("/customer/orders")
    public ResponseEntity<List<OrderResponse>> getMyOrders() {
        UUID customerId = getCurrentUserId();
        return ResponseEntity.ok(orderService.getCustomerOrders(customerId));
    }

    @GetMapping("/customer/orders/{id}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PatchMapping("/customer/orders/{id}/cancel")
    public ResponseEntity<Void> cancelOrder(@PathVariable UUID id, @RequestParam(required = false) String reason) {
        orderService.cancelOrder(id, reason != null ? reason : "Cancelled by customer");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/customer/orders/{id}/return")
    public ResponseEntity<Void> returnOrder(@PathVariable UUID id, @RequestParam(required = false) String reason) {
        orderService.returnOrder(id, reason != null ? reason : "Returned by customer");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/customer/cart/apply-coupon")
    public ResponseEntity<?> applyCoupon(@RequestParam String code) {
        Optional<Coupon> opt = couponRepository.findByCodeIgnoreCase(code);
        if (opt.isPresent()) {
            Coupon c = opt.get();
            return ResponseEntity.ok(Map.of("code", c.getCode(), "discountPercent", c.getDiscountPercent(), "valid", true));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("valid", false, "message", "Invalid coupon code"));
        }
    }

    // RETAILER Coupon endpoints
    @GetMapping("/business/coupons")
    public ResponseEntity<List<Coupon>> getSellerCoupons() {
        UUID retailerId = getCurrentUserId();
        return ResponseEntity.ok(couponRepository.findByRetailerId(retailerId));
    }

    @PostMapping("/business/coupons")
    public ResponseEntity<?> createCoupon(@RequestBody Coupon coupon) {
        UUID retailerId = getCurrentUserId();
        coupon.setRetailerId(retailerId);
        if (coupon.getCode() == null || coupon.getCode().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Coupon code is required"));
        }
        coupon.setCode(coupon.getCode().trim().toUpperCase());
        // Verify unique code check
        Optional<Coupon> existing = couponRepository.findByCodeIgnoreCase(coupon.getCode());
        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Coupon code already exists"));
        }
        Coupon saved = couponRepository.save(coupon);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/business/coupons/{id}")
    public ResponseEntity<?> deleteCoupon(@PathVariable UUID id) {
        UUID retailerId = getCurrentUserId();
        Optional<Coupon> opt = couponRepository.findById(id);
        if (opt.isPresent()) {
            Coupon coupon = opt.get();
            if (coupon.getRetailerId().equals(retailerId)) {
                couponRepository.delete(coupon);
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Unauthorized to delete this coupon"));
            }
        }
        return ResponseEntity.noContent().build();
    }

    // RETAILER endpoints
    @GetMapping("/business/orders/incoming")
    public ResponseEntity<List<OrderResponse>> getIncomingOrders() {
        UUID retailerId = getCurrentUserId();
        return ResponseEntity.ok(orderService.getIncomingOrdersForRetailer(retailerId, getAuthHeader()));
    }

    @PutMapping("/business/orders/{id}/ship")
    public ResponseEntity<OrderResponse> shipOrder(@PathVariable UUID id) {
        UUID retailerId = getCurrentUserId();
        return ResponseEntity.ok(orderService.shipOrder(retailerId, id, getAuthHeader()));
    }
}