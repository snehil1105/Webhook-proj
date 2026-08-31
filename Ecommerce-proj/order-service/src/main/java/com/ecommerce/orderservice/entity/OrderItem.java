package com.ecommerce.orderservice.entity;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    private UUID productId;
    private String productName;
    private int quantity;
    private BigDecimal unitPrice;
}