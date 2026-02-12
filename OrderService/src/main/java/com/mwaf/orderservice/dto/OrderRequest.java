package com.mwaf.orderservice.dto;

import java.util.List;
import java.math.BigDecimal;

public class OrderRequest {
    // List of order items details that the client will send
    private List<OrderItemRequest> orderItems;
    private BigDecimal totalAmount;

    public OrderRequest() {
    }

    public List<OrderItemRequest> getOrderItems() {
        return orderItems;
    }

    public void setOrderItems(List<OrderItemRequest> orderItems) {
        this.orderItems = orderItems;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
}
