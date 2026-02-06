<template>
  <div class="rating-stars">
    <div class="stars-container">
      <button
        v-for="star in 5"
        :key="star"
        type="button"
        class="star-btn"
        :class="{ 
          'active': star <= (readonly ? rating : hoverRating || rating),
          'readonly': readonly 
        }"
        :disabled="readonly"
        @click="handleStarClick(star)"
        @mouseenter="handleStarHover(star)"
        @mouseleave="handleStarLeave"
        :aria-label="`${star} star${star !== 1 ? 's' : ''}`"
      >
        <i class="bi bi-star-fill"></i>
      </button>
    </div>
    
    <div v-if="showText" class="rating-text">
      {{ ratingText }}
    </div>
    
    <div v-if="showCount && count > 0" class="rating-count">
      ({{ count }})
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  rating: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 5
  },
  readonly: {
    type: Boolean,
    default: false
  },
  showText: {
    type: Boolean,
    default: true
  },
  showCount: {
    type: Boolean,
    default: false
  },
  count: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:rating', 'change'])

const hoverRating = ref(0)

const ratingText = computed(() => {
  const texts = {
    0: t('products.products.noRating'),
    1: t('products.products.poor'),
    2: t('products.products.fair'),
    3: t('products.products.good'),
    4: t('products.products.veryGood'),
    5: t('products.products.excellent')
  }
  return texts[props.rating] || t('products.products.noRating')
})

const handleStarClick = (star) => {
  if (!props.readonly) {
    emit('update:rating', star)
    emit('change', star)
  }
}

const handleStarHover = (star) => {
  if (!props.readonly) {
    hoverRating.value = star
  }
}

const handleStarLeave = () => {
  if (!props.readonly) {
    hoverRating.value = 0
  }
}
</script>

<style scoped>
.rating-stars {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.stars-container {
  display: flex;
  align-items: center;
  gap: 2px;
}

.star-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--color-gray-300);
  transition: var(--transition-fast);
  font-size: var(--font-size-lg);
  line-height: 1;
}

.star-btn:not(.readonly):hover {
  color: var(--color-warning);
  transform: scale(1.1);
}

.star-btn.active {
  color: var(--color-warning);
}

.star-btn.readonly {
  cursor: default;
}

.star-btn.readonly:hover {
  transform: none;
}

.rating-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.rating-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}
</style> 