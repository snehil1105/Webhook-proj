package com.ecommerce.paymentservice.controller;

import com.ecommerce.paymentservice.dto.PaymentInitiateRequest;
import com.ecommerce.paymentservice.dto.PaymentResponse;
import com.ecommerce.paymentservice.dto.PaymentVerifyRequest;
import com.ecommerce.paymentservice.entity.Payment;
import com.ecommerce.paymentservice.exception.AppException;
import com.ecommerce.paymentservice.service.RazorpayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PaymentController {

    @Autowired
    private RazorpayService razorpayService;

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

    @PostMapping("/customer/payments/initiate")
    public ResponseEntity<?> initiatePayment(@Valid @RequestBody PaymentInitiateRequest request) {
        UUID customerId = getCurrentUserId();
        Payment payment = razorpayService.initiatePayment(customerId, request.getOrderId(), request.getAmount(), getAuthHeader());
        Map<String, Object> response = Map.of(
                "razorpayOrderId", payment.getRazorpayOrderId(),
                "amount", payment.getAmount(),
                "currency", payment.getCurrency(),
                "key", razorpayService.getKeyId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/customer/payments/verify")
    public ResponseEntity<PaymentResponse> verifyPayment(@Valid @RequestBody PaymentVerifyRequest request) {
        UUID customerId = getCurrentUserId();
        Payment payment = razorpayService.verifyPayment(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature());
        return ResponseEntity.ok(mapToResponse(payment));
    }

    @PostMapping("/public/payments/razorpay-webhook")
    public ResponseEntity<Void> razorpayWebhook(@RequestBody String payload) {
        try {
            JSONObject json = new JSONObject(payload);
            razorpayService.handleRazorpayWebhook(json);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            throw new AppException("Invalid webhook payload", HttpStatus.BAD_REQUEST);
        }
    }

    private PaymentResponse mapToResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrderId(),
                payment.getCustomerId(),
                payment.getRazorpayOrderId(),
                payment.getRazorpayPaymentId(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStatus(),
                payment.getCreatedAt());
    }
}