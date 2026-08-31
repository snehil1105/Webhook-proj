package com.ecommerce.userservice.service;

import com.ecommerce.userservice.dto.SellerRequest;
import com.ecommerce.userservice.dto.SellerResponse;
import com.ecommerce.userservice.entity.Seller;
import com.ecommerce.userservice.exception.AppException;
import com.ecommerce.userservice.repository.SellerRepository;
import com.ecommerce.userservice.util.EncryptionUtil;
import com.ecommerce.userservice.dto.PayoutAccountRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.UUID;

@Service
public class SellerService {

    @Autowired
    private SellerRepository sellerRepository;

    @Value("${razorpay.key-id:rzp_test_YOUR_KEY_ID}")
    private String keyId;

    @Value("${razorpay.key-secret:YOUR_KEY_SECRET}")
    private String keySecret;

    private static final Logger logger = LoggerFactory.getLogger(SellerService.class);

    public SellerResponse getProfileByUserId(UUID userId) {
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException("Seller profile not found", HttpStatus.NOT_FOUND));
        return mapToResponse(seller);
    }

    @Transactional
    public SellerResponse updateProfile(UUID userId, SellerRequest request) {
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseGet(() -> {
                    // Fallback auto-provision if missing for some reason
                    return Seller.builder().userId(userId).build();
                });

        seller.setName(request.getName());
        seller.setDescription(request.getDescription());
        seller.setLogoUrl(request.getLogoUrl());
        seller.setContactInfo(request.getContactInfo());
        seller.setRazorpayKeyId(request.getRazorpayKeyId());

        String secret = request.getRazorpayKeySecret();
        if (secret != null && !secret.isEmpty()) {
            if (!secret.startsWith("••••••")) {
                seller.setRazorpayKeySecret(EncryptionUtil.encrypt(secret));
            }
        } else {
            // Keep existing if secret input is not provided
            // or if it was masked (meaning no change)
            if (secret != null && secret.isEmpty()) {
                seller.setRazorpayKeySecret(null);
            }
        }

        Seller saved = sellerRepository.save(seller);
        return mapToResponse(saved);
    }

    @Transactional
    public SellerResponse setupPayoutAccount(UUID userId, UUID sellerId, PayoutAccountRequest request) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new AppException("Seller profile not found", HttpStatus.NOT_FOUND));

        if (!seller.getUserId().equals(userId)) {
            throw new AppException("Unauthorized to configure this seller's settings", HttpStatus.FORBIDDEN);
        }

        String accountId = null;
        String status = "activated"; // default for sandbox/simulated

        if (keyId != null && !keyId.startsWith("rzp_test_YOUR") && !"rzp_test_YOUR_KEY_ID".equals(keyId)) {
            try {
                // Call Razorpay Account API via RestTemplate
                RestTemplate restTemplate = new RestTemplate();
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
                headers.setBasicAuth(keyId, keySecret);

                // 1. Create account shell
                Map<String, Object> accountPayload = new java.util.HashMap<>();
                accountPayload.put("email", request.getEmail());
                accountPayload.put("phone", request.getPhone());
                accountPayload.put("type", "route");
                accountPayload.put("reference_id", sellerId.toString().substring(0, 20)); // max 20 chars
                accountPayload.put("legal_business_name", request.getBusinessName());
                accountPayload.put("business_type", "proprietorship");
                accountPayload.put("contact_name", request.getAccountHolderName());

                if (request.getPan() != null && !request.getPan().trim().isEmpty()) {
                    accountPayload.put("legal_info", Map.of("pan", request.getPan().trim().toUpperCase()));
                }

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(accountPayload, headers);
                ResponseEntity<Map> response = restTemplate.postForEntity("https://api.razorpay.com/v2/accounts", entity, Map.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    accountId = (String) response.getBody().get("id");
                    status = (String) response.getBody().get("status");
                    if (status == null) status = "created";
                } else {
                    throw new AppException("Failed to create Razorpay Linked Account", HttpStatus.BAD_REQUEST);
                }

                // 2. Activate Payment Gateway Product with Bank Details configuration
                Map<String, Object> productPayload = new java.util.HashMap<>();
                productPayload.put("product_name", "payment_gateway");
                productPayload.put("tnc_accepted", true);

                Map<String, Object> settlements = new java.util.HashMap<>();
                settlements.put("account_number", request.getBankAccountNumber());
                settlements.put("ifsc_code", request.getIfscCode());
                settlements.put("beneficiary_name", request.getAccountHolderName());

                productPayload.put("configuration", Map.of("settlements", settlements));

                HttpEntity<Map<String, Object>> productEntity = new HttpEntity<>(productPayload, headers);
                restTemplate.postForEntity("https://api.razorpay.com/v2/accounts/" + accountId + "/products", productEntity, Map.class);

            } catch (Exception e) {
                logger.error("Razorpay Linked Account Onboarding failed: {}", e.getMessage());
                throw new AppException("Razorpay Onboarding error: " + e.getMessage(), HttpStatus.BAD_REQUEST);
            }
        } else {
            // Simulated fallback mode
            accountId = "acc_simulated_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
            status = "activated";
        }

        seller.setRazorpayAccountId(accountId);
        seller.setAccountHolderName(request.getAccountHolderName());
        seller.setBankAccountNumber(request.getBankAccountNumber());
        seller.setIfscCode(request.getIfscCode());
        seller.setPan(request.getPan());
        seller.setBusinessName(request.getBusinessName());
        seller.setEmail(request.getEmail());
        seller.setPhone(request.getPhone());
        seller.setPayoutStatus(status);

        Seller saved = sellerRepository.save(seller);
        return mapToResponse(saved);
    }

    private SellerResponse mapToResponse(Seller seller) {
        String maskedSecret = null;
        if (seller.getRazorpayKeySecret() != null && !seller.getRazorpayKeySecret().isEmpty()) {
            String decrypted = EncryptionUtil.decrypt(seller.getRazorpayKeySecret());
            int len = decrypted.length();
            if (len > 4) {
                maskedSecret = "••••••" + decrypted.substring(len - 4);
            } else {
                maskedSecret = "••••••";
            }
        }
        return SellerResponse.builder()
                .id(seller.getId())
                .userId(seller.getUserId())
                .name(seller.getName() != null ? seller.getName() : "My Shop")
                .description(seller.getDescription())
                .logoUrl(seller.getLogoUrl())
                .contactInfo(seller.getContactInfo())
                .razorpayKeyId(seller.getRazorpayKeyId())
                .razorpayKeySecret(maskedSecret)
                .razorpayAccountId(seller.getRazorpayAccountId())
                .accountHolderName(seller.getAccountHolderName())
                .bankAccountNumber(seller.getBankAccountNumber())
                .ifscCode(seller.getIfscCode())
                .pan(seller.getPan())
                .businessName(seller.getBusinessName())
                .email(seller.getEmail())
                .phone(seller.getPhone())
                .payoutStatus(seller.getPayoutStatus() != null ? seller.getPayoutStatus() : "PENDING")
                .build();
    }
}
