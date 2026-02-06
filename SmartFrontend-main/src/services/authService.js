// src/services/authService.js

import { authApi } from './api'

// Export as both loginUser and login for backward compatibility
export function login(loginData) {
    // loginData should be { username, password }
    return authApi.post('/login', loginData)
}

// Keep the original function for existing code
export function loginUser(loginData) {
    return login(loginData);
}

export const register = async (userData) => {
    return authApi.post('/register', userData);
};

// Keep the original function for existing code
export const registerUser = async (userData) => {
    return register(userData);
};