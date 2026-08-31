package com.ecommerce.userservice.controller;

import com.ecommerce.userservice.dto.SellerRequest;
import com.ecommerce.userservice.dto.SellerResponse;
import com.ecommerce.userservice.dto.PayoutAccountRequest;
import com.ecommerce.userservice.service.SellerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class SellerController {

    @Autowired
    private SellerService sellerService;

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("No authenticated user");
        }
        return UUID.fromString(authentication.getPrincipal().toString());
    }

    @GetMapping("/business/profile")
    public ResponseEntity<SellerResponse> getProfile() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(sellerService.getProfileByUserId(userId));
    }

    @PutMapping("/business/profile")
    public ResponseEntity<SellerResponse> updateProfile(@Valid @RequestBody SellerRequest request) {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(sellerService.updateProfile(userId, request));
    }

    @PostMapping("/business/sellers/{sellerId}/payout-account")
    public ResponseEntity<SellerResponse> setupPayoutAccount(
            @PathVariable UUID sellerId,
            @Valid @RequestBody PayoutAccountRequest request) {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(sellerService.setupPayoutAccount(userId, sellerId, request));
    }

    @GetMapping("/public/sellers/{userId}")
    public ResponseEntity<SellerResponse> getSellerProfile(@PathVariable UUID userId) {
        SellerResponse response = sellerService.getProfileByUserId(userId);
        response.setBankAccountNumber(null);
        response.setIfscCode(null);
        response.setPan(null);
        response.setRazorpayKeySecret(null);
        response.setRazorpayKeyId(null);
        return ResponseEntity.ok(response);
    }
}
