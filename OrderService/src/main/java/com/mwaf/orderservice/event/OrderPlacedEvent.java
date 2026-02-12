package com.mwaf.orderservice.event;

import java.util.List;

public class OrderPlacedEvent {
    private Long orderId;
    private Long customerId;
    private List<OrderItemDto> items;

    public OrderPlacedEvent() {
    }

    public OrderPlacedEvent(Long orderId, Long customerId, List<OrderItemDto> items) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.items = items;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public List<OrderItemDto> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDto> items) {
        this.items = items;
    }

    public static class OrderItemDto {
        private Long productId;
        private Integer quantity;

        public OrderItemDto() {
        }

        public OrderItemDto(Long productId, Integer quantity) {
            this.productId = productId;
            this.quantity = quantity;
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
    }
}
