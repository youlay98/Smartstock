<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { notificationWebSocket } from '@/services/notificationWebSocket';

const authStore = useAuthStore();

onMounted(() => {
  if (authStore.user) {
    // Re-establish WebSocket connection if user is already logged in (e.g., page refresh)
    notificationWebSocket.connect(authStore.user);
  }
});
</script>

