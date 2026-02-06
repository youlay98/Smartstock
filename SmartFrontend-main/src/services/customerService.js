// src/services/customerService.js
import { customerApi } from './api';


export function getAllCustomers() {
    return customerApi.get('');
}

export function getCustomerById(customerId) {
    return customerApi.get(`/${customerId}`);
}

export function updateCustomer(customerId, customerData) {
    return customerApi.put(`/${customerId}`, customerData);
}

export function deleteCustomer(customerId) {
    return customerApi.delete(`/${customerId}`);
}

export function getCustomerByUserId(userId) {
    return customerApi.get(`/byUserId/${userId}`);
}




//
// export function getAllCustomers() {
//     return customerApi.get('/api/customer');
// }
//
// export function getCustomerById(customerId) {
//     return customerApi.get(`/api/customers/${customerId}`);
// }
//
// export function updateCustomer(customerId, customerData) {
//     return customerApi.put(`/api/customers/${customerId}`, customerData);
// }
//
// export function deleteCustomer(customerId) {
//     return customerApi.delete(`/api/customers/${customerId}`);
// }
//
// export function getCustomerByUserId(userId) {
//     return customerApi.get(`/api/customers/byUserId/${userId}`);
// }