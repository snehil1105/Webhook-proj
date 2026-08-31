package com.ecommerce.paymentservice.dto;

import com.ecommerce.paymentservice.entity.Payment;
import java.math.BigDecimal;
import java.util.Date;
import java.util.UUID;

public class PaymentResponse {

    private UUID id;
    private UUID orderId;
    private UUID customerId;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private BigDecimal amount;
    private String currency;
    private Payment.Status status;
    private Date createdAt;

    public PaymentResponse() {}

    public PaymentResponse(UUID id, UUID orderId, UUID customerId, String razorpayOrderId,
                           String razorpayPaymentId, BigDecimal amount, String currency,
                           Payment.Status status, Date createdAt) {
        this.id = id;
        this.orderId = orderId;
        this.customerId = customerId;
        this.razorpayOrderId = razorpayOrderId;
        this.razorpayPaymentId = razorpayPaymentId;
        this.amount = amount;
        this.currency = currency;
        this.status = status;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getOrderId() { return orderId; }
    public void setOrderId(UUID orderId) { this.orderId = orderId; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public Payment.Status getStatus() { return status; }
    public void setStatus(Payment.Status status) { this.status = status; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}