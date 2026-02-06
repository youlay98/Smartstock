// src/services/orderService.js
import { orderApi } from './api';

export function getAllOrders() {
    return orderApi.get('');
}

export function createOrder(orderData) {
    return orderApi.post('', orderData);
}

export function placeOrder(orderData) {
    return orderApi.post('/placeOrder', orderData);
}

export function updateOrder(orderId, orderData) {
    return orderApi.put(`/${orderId}`, orderData);
}

export function deleteOrder(orderId) {
    return orderApi.delete(`/${orderId}`);
}

export function getOrdersByCustomer(customerId) {
    return orderApi.get(`/byCustomer/${customerId}`);
}