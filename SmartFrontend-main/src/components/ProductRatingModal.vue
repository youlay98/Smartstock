<template>
  <div v-if="isOpen" class="rating-modal-overlay" @click.self="closeModal">
    <div class="rating-modal">
      <div class="modal-header">
        <h5>{{ $t('products.products.rateThisProduct') }}</h5>
        <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
      </div>
      
      <div class="modal-body">
        <div class="product-info" v-if="product">
          <h6>{{ product.name }}</h6>
          <p class="text-muted">{{ product.description }}</p>
        </div>
        
        <div class="rating-section">
          <label class="form-label">{{ $t('products.products.yourRating') }}</label>
          <RatingStars 
            v-model:rating="userRating" 
            :readonly="false"
            :show-text="true"
            @change="handleRatingChange"
          />
        </div>
        
        <div class="review-section">
          <label class="form-label">{{ $t('products.products.reviewOptional') }}</label>
          <textarea 
            v-model="userReview" 
            class="form-control" 
            rows="3" 
            :placeholder="$t('products.products.reviewPlaceholder')"
          ></textarea>
        </div>
      </div>
      
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="closeModal">
          {{ $t('products.products.cancel') }}
        </button>
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="submitRating"
          :disabled="isSubmitting || userRating === 0"
        >
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
          {{ $t('products.products.submitRating') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import RatingStars from '@/ui/atoms/RatingStars.vue'
import { createOrUpdateReview } from '@/services/reviewService'
import { showSuccessToast, showWarningToast } from '@/services/api'

const { t } = useI18n()

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  product: {
    type: Object,
    required: false,
    default: null
  }
})

const emit = defineEmits(['close', 'rating-submitted'])

const userRating = ref(0)
const userReview = ref('')
const isSubmitting = ref(false)

// Reset form when modal opens
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    userRating.value = 0
    userReview.value = ''
    isSubmitting.value = false
  }
})

const handleRatingChange = (rating) => {
  userRating.value = rating
}

const closeModal = () => {
  emit('close')
}

const submitRating = async () => {
  if (userRating.value === 0) return
  
  try {
    isSubmitting.value = true
    
    const reviewData = {
      rating: userRating.value,
      comment: userReview.value || null
    }
    
    console.log('Submitting review for product:', props.product.id, reviewData)
    await createOrUpdateReview(props.product.id, reviewData)
    
    showSuccessToast('Rating submitted successfully!')
    emit('rating-submitted', { productId: props.product.id, rating: userRating.value })
    closeModal()
    
  } catch (error) {
    console.error('Error submitting rating:', error)
    showWarningToast('Failed to submit rating. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.rating-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
}

.rating-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h5 {
  margin: 0;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
}

.btn-close:hover {
  color: #000;
}

.modal-body {
  padding: 1.5rem;
}

.product-info {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f3f4;
}

.product-info h6 {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.rating-section {
  margin-bottom: 1.5rem;
}

.review-section {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.15s ease-in-out;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.text-muted {
  color: #6c757d;
  margin: 0;
  font-size: 0.9rem;
}
</style> 