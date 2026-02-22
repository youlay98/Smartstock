package com.mwaf.orderservice.event;

public class OrderStatusChangedEvent {
    private Long orderId;
    private Long customerId;
    private String newStatus;

    public OrderStatusChangedEvent() {
    }

    public OrderStatusChangedEvent(Long orderId, Long customerId, String newStatus) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.newStatus = newStatus;
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

    public String getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(String newStatus) {
        this.newStatus = newStatus;
    }
}
