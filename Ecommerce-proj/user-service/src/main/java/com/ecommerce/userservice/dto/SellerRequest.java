package com.ecommerce.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerRequest {

    @NotBlank(message = "Shop name is required")
    private String name;

    private String description;
    private String logoUrl;
    private String contactInfo;
    private String razorpayKeyId;
    private String razorpayKeySecret;
}
