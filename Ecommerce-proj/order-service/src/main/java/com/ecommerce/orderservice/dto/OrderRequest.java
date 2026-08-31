package com.ecommerce.orderservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class OrderRequest {

    @Valid
    @NotEmpty(message = "Order must contain at least one item")
    private List<OrderItemRequest> items;

    private String coupon;

    public OrderRequest() {}

    public OrderRequest(List<OrderItemRequest> items) {
        this.items = items;
    }

    public OrderRequest(List<OrderItemRequest> items, String coupon) {
        this.items = items;
        this.coupon = coupon;
    }

    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }

    public String getCoupon() { return coupon; }
    public void setCoupon(String coupon) { this.coupon = coupon; }
}