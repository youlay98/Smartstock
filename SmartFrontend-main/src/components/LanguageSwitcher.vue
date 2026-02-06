<template>
  <div class="language-switcher" :class="{ 'sidebar-context': context === 'sidebar' }">
    <div class="dropdown">
      <button 
        class="btn btn-outline-light dropdown-toggle" 
        type="button" 
        @click="toggleDropdown"
                        :title="$t('common.common.language')"
      >
        <span class="flag">{{ currentLocaleFlag }}</span>
        <span class="locale-name">{{ currentLocaleName }}</span>
      </button>
      <ul v-if="isDropdownOpen" class="dropdown-menu show">
        <li v-for="locale in availableLocales" :key="locale.code">
          <button 
            class="dropdown-item" 
            :class="{ active: locale.code === currentLocale }"
            @click="switchLanguage(locale.code)"
          >
            <span class="flag">{{ locale.flag }}</span>
            <span class="locale-name">{{ locale.name }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, availableLocales } from '@/i18n'

// Props
const props = defineProps({
  context: {
    type: String,
    default: 'header',
    validator: (value) => ['header', 'sidebar'].includes(value)
  }
})

const { locale } = useI18n()

const isDropdownOpen = ref(false)

const currentLocale = computed(() => locale.value)
const currentLocaleFlag = computed(() => {
  const current = availableLocales.find(l => l.code === currentLocale.value)
  return current ? current.flag : '🌐'
})
const currentLocaleName = computed(() => {
  const current = availableLocales.find(l => l.code === currentLocale.value)
  return current ? current.name : 'Language'
})

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

async function switchLanguage(localeCode) {
  await setLocale(localeCode)
  isDropdownOpen.value = false
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
  if (!event.target.closest('.language-switcher')) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.language-switcher {
  margin-left: 1rem;
}

.language-switcher .btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background-color: transparent;
  color: rgba(255, 255, 255, 0.85);
  transition: all 0.3s ease;
  width: 100%;
  justify-content: center;
}

/* Context-specific styling */
.language-switcher:not(.sidebar-context) .btn {
  width: auto;
  justify-content: flex-start;
  border: 1px solid var(--color-border);
  background-color: var(--color-white);
  color: var(--color-text-primary);
}

.language-switcher:not(.sidebar-context) .btn:hover {
  background-color: var(--color-background-soft);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

/* Ensure dropdown is visible */
.language-switcher .dropdown-menu {
  position: absolute;
  z-index: 1000;
  min-width: 120px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 0.5rem;
  background: white;
}

.language-switcher .dropdown-menu.show {
  display: block;
}

.language-switcher .btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border-color: rgba(255, 255, 255, 0.5);
}

.language-switcher .dropdown-menu {
  min-width: 120px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 0.5rem;
}

.language-switcher .dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--text-dark);
  transition: all 0.2s ease;
}

.language-switcher .dropdown-item:hover {
  background-color: var(--neutral-light);
}

.language-switcher .dropdown-item.active {
  background-color: var(--primary-color);
  color: white;
}

.flag {
  font-size: 1.1rem;
}

.locale-name {
  font-weight: 500;
}

@media (max-width: 768px) {
  .language-switcher .locale-name {
    display: none;
  }
  
  .language-switcher .btn {
    padding: 0.375rem;
  }
}
</style> 