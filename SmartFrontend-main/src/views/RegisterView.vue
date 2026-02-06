<template>
  <MainLayout>
    <!-- Container -->
    <div class="register-container">
      <!-- Card wrapper -->
      <div class="register-card">
        <div class="text-center mb-4">
          <i class="bi bi-person-plus-fill text-primary" style="font-size: 3rem;"></i>
          <h1 class="fw-bold mt-3">Join SmartStock</h1>
          <p class="text-muted">Create your account to get started</p>
        </div>

        <!-- Error message if any -->
        <div v-if="errorMessage" class="alert alert-danger" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          {{ errorMessage }}
        </div>

        <!-- The main registration card -->
        <div class="card p-4 shadow">
          <h2 class="mb-4 text-center">Register</h2>

          <form @submit.prevent="handleRegister">
            <div class="mb-3">
              <label for="name" class="form-label">Full Name</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-person"></i></span>
                <input
                    v-model="form.name"
                    type="text"
                    class="form-control"
                    id="name"
                    placeholder="Enter your full name"
                    required
                />
              </div>
            </div>

            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                <input
                    v-model="form.email"
                    type="email"
                    class="form-control"
                    id="email"
                    placeholder="Enter your email"
                    required
                />
              </div>
            </div>

            <div class="mb-3">
              <label for="phone" class="form-label">Phone</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-telephone"></i></span>
                <input
                    v-model="form.phone"
                    type="text"
                    class="form-control"
                    id="phone"
                    placeholder="Enter your phone number"
                    required
                />
              </div>
            </div>

            <div class="mb-3">
              <label for="address" class="form-label">Address</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-geo-alt"></i></span>
                <input
                    v-model="form.address"
                    type="text"
                    class="form-control"
                    id="address"
                    placeholder="Enter your address"
                    required
                />
              </div>
            </div>

            <div class="mb-3">
              <label for="username" class="form-label">Username</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-person-badge"></i></span>
                <input
                    v-model="form.username"
                    type="text"
                    class="form-control"
                    id="username"
                    placeholder="Choose a username"
                    required
                />
              </div>
            </div>

            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-lock"></i></span>
                <input
                    v-model="form.password"
                    type="password"
                    class="form-control"
                    id="password"
                    placeholder="Enter a password"
                    required
                />
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-100 py-2 mt-3">
              <i class="bi bi-check-circle me-2"></i>
              Register
            </button>
          </form>

          <div class="mt-3 text-center">
            <p>
              Already have an account?
              <router-link to="/login" class="text-primary">Login here</router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { registerUser } from '@/services/authService';
import MainLayout from '@/components/MainLayout.vue';

const router = useRouter();
const errorMessage = ref('');

const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  username: '',
  password: '',
});

async function handleRegister() {
  try {
    errorMessage.value = '';
    await registerUser(form.value);
    router.push('/login?registered=true');
  } catch (error) {
    console.error('Registration error:', error);
    errorMessage.value =
        error.response?.data?.message || 'Registration failed. Please try again.';
  }
}
</script>

<style scoped>
/* Match the Login page container and card styles */
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  /* Same height offset and background as login */
  min-height: calc(100vh - 140px);
  background-color: var(--bg-muted);
  padding: 2rem 1rem;
}

/* Keep max-width consistent with login, or adjust to suit your form */
.register-card {
  width: 100%;
  max-width: 450px; /* same as login for a similar look */
}

/* Make the card style consistent with login */
.card {
  border: none;
  border-radius: 10px; /* matching the login style border radius */
}

/* Same input-group-text styling as login */
.input-group-text {
  background-color: var(--primary-color);
  color: white;
  border: 1px solid var(--primary-color);
}

/* Same button style as login */
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

/* Optional: style the label similarly to the login page */
.form-label {
  font-weight: 500;
}

/* Optional: highlight the focus state on inputs */
.form-control:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.25rem rgba(46, 204, 113, 0.25);
}
</style>
