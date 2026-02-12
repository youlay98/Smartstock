package com.mwaf.orderservice.dto;

import java.math.BigDecimal;

public class OrderItemRequest {
    private Long productId;
    private Integer quantity;
    // Optionally include the unitPrice if needed; otherwise, fetch from Product
    // Service.
    private BigDecimal unitPrice;

    public OrderItemRequest() {
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }
}
