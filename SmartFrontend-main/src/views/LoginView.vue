<template>
  <MainLayout>
    <div class="login-container">
      <div class="login-card">
        <div class="text-center mb-4">
          <i class="bi bi-box-seam text-primary" style="font-size: 3rem;"></i>
          <h1 class="fw-bold mt-3">{{ $t('auth.login.welcome') }}</h1>
          <p class="text-muted">{{ $t('common.brand.tagline') }}</p>
        </div>

        <div v-if="loginError" class="alert alert-danger" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          {{ loginError }}
        </div>

        <div class="card p-4 shadow">
          <h2 class="mb-4 text-center">{{ $t('auth.login.title') }}</h2>
          <form @submit.prevent="handleLogin">
            <div class="mb-3">
              <label for="username" class="form-label">{{ $t('auth.login.username') }}</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-person"></i></span>
                <input
                    v-model="username"
                    type="text"
                    id="username"
                    class="form-control"
                    :placeholder="$t('auth.login.usernamePlaceholder')"
                    required
                />
              </div>
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">{{ $t('auth.login.password') }}</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-lock"></i></span>
                <input
                    v-model="password"
                    type="password"
                    id="password"
                    class="form-control"
                    :placeholder="$t('auth.login.passwordPlaceholder')"
                    required
                />
              </div>
            </div>
            <button type="submit" class="btn btn-primary w-100 py-2">
              <i class="bi bi-box-arrow-in-right me-2"></i>
              {{ $t('auth.login.loginButton') }}
            </button>
          </form>
          <div class="mt-3 text-center">
            <p>{{ $t('auth.login.noAccount') }} <router-link to="/register" class="text-primary">{{ $t('auth.login.registerLink') }}</router-link></p>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import MainLayout from '@/components/MainLayout.vue';
import { loginUser } from '@/services/authService.js';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();

const username = ref('');
const password = ref('');
const loginError = ref('');
const router = useRouter();
const authStore = useAuthStore();

async function handleLogin() {
  loginError.value = '';
  try {
    const response = await loginUser({
      username: username.value,
      password: password.value,
    });

    const token = response.data.token;
    
    if (!token) {
      throw new Error('Token not found in login response');
    }
    
    authStore.setToken(token);

    // Check user roles to determine where to redirect
    if (authStore.user?.roles?.includes('ROLE_ADMIN')) {
      await router.push('/admin');
    } else {
      await router.push('/dashboard');
    }
  } catch (error) {
    console.error('Login error:', error);
    loginError.value = t('auth.login.error');
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 140px);
  background-color: var(--bg-muted);
  padding: 2rem 1rem;
}

.login-card {
  width: 100%;
  max-width: 450px;
}

.card {
  border: none;
  border-radius: 10px;
}

.input-group-text {
  background-color: var(--primary-color);
  color: white;
  border: 1px solid var(--primary-color);
}

.btn-primary {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  border-color: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
