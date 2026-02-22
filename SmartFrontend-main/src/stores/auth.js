import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loginUser as apiLogin, register as apiRegister } from '@/services/authService';
import { notificationWebSocket } from '@/services/notificationWebSocket';

// Helper function for safe JSON parsing
function safeParse(json) {
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export const useAuthStore = defineStore('auth', () => {
    // Initialize state from localStorage if available
    const storedUserRaw = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    const user = ref(storedUserRaw ? safeParse(storedUserRaw) : null);
    const token = ref(storedToken || null);
    const isAuthenticated = computed(() => !!token.value);

    async function login(credentials) {
        try {
            const response = await apiLogin(credentials);

            // Store user and token in state and localStorage
            user.value = response.data.user;
            token.value = response.data.token;

            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('token', response.data.token);

            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Add setToken function to match what's used in LoginView
    function setToken(newToken) {
        token.value = newToken;
        localStorage.setItem('token', newToken);

        // Parse the JWT token to get user data
        try {
            const base64Url = newToken.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            user.value = {
                id: payload.id || payload.sub,
                username: payload.username || payload.sub,
                roles: payload.roles || []
            };

            localStorage.setItem('user', JSON.stringify(user.value));

            // Connect to real-time notifications once user info is loaded
            notificationWebSocket.connect(user.value);
        } catch (error) {
            console.error('Error parsing JWT token:', error);
        }
    }

    async function register(userData) {
        try {
            const response = await apiRegister(userData);
            return response;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    function logout() {
        // Clear state and localStorage
        user.value = null;
        token.value = null;
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        // Disconnect real-time notifications
        notificationWebSocket.disconnect();
    }

    return {
        user,
        token,
        isAuthenticated,
        login,
        register,
        logout,
        setToken
    };
});