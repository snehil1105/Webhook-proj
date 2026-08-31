package com.ecommerce.userservice.dto;

import lombok.*;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerResponse {
    private UUID id;
    private UUID userId;
    private String name;
    private String description;
    private String logoUrl;
    private String contactInfo;
    private String razorpayKeyId;
    private String razorpayKeySecret; // Masked secret
    
    private String razorpayAccountId;
    private String accountHolderName;
    private String bankAccountNumber;
    private String ifscCode;
    private String pan;
    private String businessName;
    private String email;
    private String phone;
    private String payoutStatus;
}
