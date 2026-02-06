<!-- src/components/MainLayout.vue -->
<template>
  <div>
    <!-- Fixed Navbar -->
    <nav class="navbar navbar-expand-lg navbar-custom fixed-top">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">
          <i class="bi bi-box-seam me-2"></i>
          {{ $t('common.brand.name') }}
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/login">{{ $t('common.navigation.login') }}</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/register">{{ $t('common.navigation.register') }}</router-link>
            </li>
            <li class="nav-item">
              <LanguageSwitcher />
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Content Container with proper height -->
    <div class="content-container">
      <slot />
    </div>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="row">
          <div class="col-md-6">
            <p>{{ $t('common.footer.copyright') }}</p>
          </div>
          <div class="col-md-6 text-md-end">
            <a href="#" class="text-decoration-none me-3">{{ $t('common.footer.privacyPolicy') }}</a>
            <a href="#" class="text-decoration-none">{{ $t('common.footer.termsOfService') }}</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import LanguageSwitcher from './LanguageSwitcher.vue'
</script>

<style scoped>
.navbar-custom {
  background-color: var(--primary-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0.75rem 1rem;
}

.navbar-custom .navbar-brand {
  color: white;
  font-weight: 600;
  font-size: 1.4rem;
}

.navbar-custom .nav-link {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  transition: color 0.3s ease;
}

.navbar-custom .nav-link:hover,
.navbar-custom .nav-link.active {
  color: white;
}

/* Ensure content-container takes full available height */
.content-container {
  margin-top: 70px; /* Adjust based on your navbar height */
  min-height: calc(100vh - 130px); /* Adjust for navbar + footer */
  padding: 2rem 0;
}

.footer {
  background-color: var(--neutral-light);
  padding: 1.5rem 0;
  color: var(--text-dark);
  font-size: 0.9rem;
}
</style>
