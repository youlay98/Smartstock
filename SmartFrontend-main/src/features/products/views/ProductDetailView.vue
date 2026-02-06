<template>
  <div class="product-detail-container">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3">Loading product details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        {{ error }}
        <button class="btn btn-sm btn-outline-danger ms-3" @click="loadProduct">
          Try Again
        </button>
      </div>
    </div>

    <!-- Product Content -->
    <div v-else-if="product" class="product-content">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="breadcrumb-nav">
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link to="/dashboard">Dashboard</router-link>
          </li>
          <li class="breadcrumb-item">
            <router-link to="/products">Products</router-link>
          </li>
          <li class="breadcrumb-item active" aria-current="page">
            {{ product.name }}
          </li>
        </ol>
      </nav>

      <!-- Product Header -->
      <div class="product-header">
        <div class="row">
          <!-- Product Image -->
          <div class="col-md-6">
            <div class="product-image-container">
              <img
                :src="getProductImage(product)"
                :alt="product.name"
                class="product-image"
                @error="handleImageError"
              />
            </div>
          </div>

          <!-- Product Info -->
          <div class="col-md-6">
            <div class="product-info">
              <h1 class="product-title">{{ product.name }}</h1>
              
              <!-- Category -->
              <div class="product-category">
                <span class="badge bg-primary">
                  {{ getCategoryName(product) }}
                </span>
              </div>

              <!-- Rating -->
              <div class="product-rating">
                <RatingStars
                  :rating="product.averageRating || 0"
                  :count="product.reviewCount || 0"
                  readonly
                  show-count
                />
              </div>

              <!-- Price -->
              <div class="product-price">
                <span class="price-amount">€{{ formatPrice(product.price) }}</span>
              </div>

              <!-- Stock Status -->
              <div class="product-stock">
                <div class="stock-info">
                  <i class="bi bi-box-seam"></i>
                              <span v-if="(product.stockQuantity || product.stock_quantity || 0) > 5" class="text-success">
              {{ product.stockQuantity || product.stock_quantity || 0 }} in stock
            </span>
            <span v-else-if="(product.stockQuantity || product.stock_quantity || 0) > 0" class="text-warning">
              Only {{ product.stockQuantity || product.stock_quantity || 0 }} left
            </span>
                  <span v-else class="text-danger">
                    Out of stock
                  </span>
                </div>
              </div>

              <!-- Add to Cart -->
              <div class="product-actions">
                <div class="quantity-selector">
                  <label for="quantity">Quantity:</label>
                  <div class="quantity-controls">
                    <button
                      class="btn btn-outline-secondary"
                      @click="decreaseQuantity"
                      :disabled="quantity <= 1"
                    >
                      <i class="bi bi-dash"></i>
                    </button>
                    <input
                      id="quantity"
                      v-model.number="quantity"
                      type="number"
                      min="1"
                      :max="product.stockQuantity || product.stock_quantity || 0"
                      class="form-control quantity-input"
                    />
                    <button
                      class="btn btn-outline-secondary"
                      @click="increaseQuantity"
                      :disabled="quantity >= (product.stockQuantity || product.stock_quantity || 0)"
                    >
                      <i class="bi bi-plus"></i>
                    </button>
                  </div>
                </div>

                <AppButton
                  variant="primary"
                  size="lg"
                  icon="bi-cart-plus"
                  :disabled="(product.stockQuantity || product.stock_quantity || 0) <= 0"
                  :loading="isAddingToCart"
                  @click="addToCart"
                  block
                >
                  {{ (product.stockQuantity || product.stock_quantity || 0) > 0 ? 'Add to Cart' : 'Out of Stock' }}
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Product Tabs -->
      <div class="product-tabs">
        <ul class="nav nav-tabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'description' }"
              @click="activeTab = 'description'"
              type="button"
              role="tab"
            >
              Description
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'reviews' }"
              @click="activeTab = 'reviews'"
              type="button"
              role="tab"
            >
              Reviews ({{ product.reviewCount || 0 }})
            </button>
          </li>
        </ul>

        <div class="tab-content">
          <!-- Description Tab -->
          <div
            v-show="activeTab === 'description'"
            class="tab-pane fade show active"
            role="tabpanel"
          >
            <div class="description-content">
              <h3>Product Description</h3>
              <p v-if="product.description" class="description-text">
                {{ product.description }}
              </p>
              <p v-else class="text-muted">
                No description available for this product.
              </p>
            </div>
          </div>

          <!-- Reviews Tab -->
          <div
            v-show="activeTab === 'reviews'"
            class="tab-pane fade show active"
            role="tabpanel"
          >
            <div class="reviews-content">
              <!-- Review Summary -->
              <div v-if="reviewSummary" class="review-summary">
                <div class="row">
                  <div class="col-md-4">
                    <div class="overall-rating">
                      <div class="rating-score">{{ reviewSummary.averageRating.toFixed(1) }}</div>
                      <RatingStars
                        :rating="reviewSummary.averageRating"
                        readonly
                        :show-text="false"
                      />
                      <div class="rating-count">
                        {{ reviewSummary.totalReviews }} reviews
                      </div>
                    </div>
                  </div>
                  <div class="col-md-8">
                    <div class="rating-breakdown">
                      <div
                        v-for="rating in 5"
                        :key="rating"
                        class="rating-bar"
                      >
                        <span class="rating-label">{{ rating }} stars</span>
                        <div class="rating-progress">
                          <div
                            class="progress-bar"
                            :style="{ width: getRatingPercentage(rating) + '%' }"
                          ></div>
                        </div>
                        <span class="rating-count">{{ getRatingCount(rating) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Write Review -->
              <div class="write-review-section">
                <h4>Write a Review</h4>
                <form @submit.prevent="submitReview" class="review-form">
                  <div class="row">
                    <div class="col-md-6">
                      <div class="form-group">
                        <label class="form-label">Rating</label>
                        <RatingStars
                          v-model:rating="newReview.rating"
                          :readonly="false"
                          :show-text="false"
                        />
                      </div>
                    </div>
                    <div class="col-md-6">
                      <AppInput
                        v-model="newReview.title"
                        label="Title"
                        placeholder="Brief summary of your experience"
                        :error="reviewErrors.title"
                        required
                      />
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Comment</label>
                    <textarea
                      v-model="newReview.comment"
                      class="form-control"
                      :class="{ 'is-invalid': reviewErrors.comment }"
                      rows="4"
                      placeholder="Share your experience with this product..."
                      required
                    ></textarea>
                    <div v-if="reviewErrors.comment" class="invalid-feedback d-block">
                      {{ reviewErrors.comment }}
                    </div>
                  </div>

                  <AppButton
                    type="submit"
                    variant="primary"
                    :loading="isSubmittingReview"
                    :disabled="!isReviewValid"
                  >
                    Submit Review
                  </AppButton>
                </form>
              </div>

              <!-- Reviews List -->
              <div class="reviews-list">
                <h4>Customer Reviews</h4>
                
                <div v-if="reviews.length === 0" class="no-reviews">
                  <p class="text-muted">No reviews yet. Be the first to review this product!</p>
                </div>

                <div v-else class="review-items">
                  <div
                    v-for="review in reviews"
                    :key="review.id"
                    class="review-item"
                  >
                    <div class="review-header">
                      <div class="reviewer-info">
                        <div class="reviewer-name">{{ review.userName || 'Anonymous' }}</div>
                        <div class="review-date">{{ formatDate(review.createdAt) }}</div>
                      </div>
                      <div class="review-rating">
                        <RatingStars
                          :rating="review.rating"
                          readonly
                          :show-text="false"
                        />
                      </div>
                    </div>
                    
                    <div class="review-title">{{ review.title }}</div>
                    <div class="review-comment">{{ review.comment }}</div>
                    
                    <!-- Review Actions (for user's own reviews) -->
                    <div v-if="isUserReview(review)" class="review-actions">
                      <button
                        class="btn btn-sm btn-outline-primary"
                        @click="editReview(review)"
                      >
                        <i class="bi bi-pencil"></i> Edit
                      </button>
                      <button
                        class="btn btn-sm btn-outline-danger"
                        @click="deleteReview(review.id)"
                      >
                        <i class="bi bi-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Pagination -->
                <div v-if="totalPages > 1" class="pagination-container">
                  <nav aria-label="Reviews pagination">
                    <ul class="pagination justify-content-center">
                      <li class="page-item" :class="{ disabled: currentPage === 0 }">
                        <button
                          class="page-link"
                          @click="changePage(currentPage - 1)"
                          :disabled="currentPage === 0"
                        >
                          Previous
                        </button>
                      </li>
                      <li
                        v-for="page in visiblePages"
                        :key="page"
                        class="page-item"
                        :class="{ active: page === currentPage }"
                      >
                        <button
                          class="page-link"
                          @click="changePage(page)"
                        >
                          {{ page + 1 }}
                        </button>
                      </li>
                      <li class="page-item" :class="{ disabled: currentPage === totalPages - 1 }">
                        <button
                          class="page-link"
                          @click="changePage(currentPage + 1)"
                          :disabled="currentPage === totalPages - 1"
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '@/stores/products'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import RatingStars from '@/ui/atoms/RatingStars.vue'
import AppButton from '@/ui/atoms/AppButton.vue'
import AppInput from '@/ui/atoms/AppInput.vue'
import { showSuccessToast, showWarningToast } from '@/services/api'

const route = useRoute()
const router = useRouter()

const productStore = useProductStore()
const cartStore = useCartStore()
const authStore = useAuthStore()

// Component state
const activeTab = ref('description')
const quantity = ref(1)
const isAddingToCart = ref(false)
const isSubmittingReview = ref(false)
const currentPage = ref(0)
const pageSize = 5

// Review form
const newReview = ref({
  rating: 0,
  title: '',
  comment: ''
})

const reviewErrors = ref({})

// Computed
const product = computed(() => productStore.currentProduct)
const reviews = computed(() => productStore.productReviews)
const reviewSummary = computed(() => productStore.reviewSummary)
const isLoading = computed(() => productStore.isLoading)
const error = computed(() => productStore.error)

const totalPages = computed(() => {
  if (!reviewSummary.value) return 0
  return Math.ceil(reviewSummary.value.totalReviews / pageSize)
})

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(0, currentPage.value - 2)
  const end = Math.min(totalPages.value - 1, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const isReviewValid = computed(() => {
  return newReview.value.rating > 0 &&
         newReview.value.title.trim() &&
         newReview.value.comment.trim()
})

// Methods
const loadProduct = async () => {
  const productId = parseInt(route.params.id)
  if (!productId) {
    router.push('/dashboard')
    return
  }
  
  try {
    await productStore.loadProductById(productId)
    await loadReviews()
  } catch (error) {
    console.error('Error loading product:', error)
  }
}

const loadReviews = async () => {
  if (!product.value) return
  
  try {
    await productStore.loadProductReviews(product.value.id, currentPage.value, pageSize)
    await productStore.loadProductReviewSummary(product.value.id)
  } catch (error) {
    console.error('Error loading reviews:', error)
  }
}

const getProductImage = (product) => {
  return product.imageUrl || '/placeholder-product.jpg'
}

const handleImageError = (event) => {
  event.target.src = '/placeholder-product.jpg'
}

const getCategoryName = (product) => {
  // Check if product has a category object
  if (product.category && product.category.name) {
    return product.category.name
  }
  
  // Check if product has categoryId
  if (product.categoryId) {
    const category = productStore.categories.find(c => c.id === product.categoryId)
    if (category) {
      return category.name
    }
  }
  
  // Check if product has category_id
  if (product.category_id) {
    const category = productStore.categories.find(c => c.id === product.category_id)
    if (category) {
      return category.name
    }
  }
  
  return 'Uncategorized'
}

const formatPrice = (price) => {
  return Number(price).toFixed(2)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const increaseQuantity = () => {
  if (quantity.value < product.value.stockQuantity) {
    quantity.value++
  }
}

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

const addToCart = async () => {
  if (!product.value || product.value.stockQuantity <= 0) return

  try {
    isAddingToCart.value = true
    await cartStore.addItem(product.value.id, quantity.value)
    showSuccessToast(`${product.value.name} added to cart!`)
  } catch (error) {
    console.error('Error adding to cart:', error)
    showWarningToast('Failed to add item to cart')
  } finally {
    isAddingToCart.value = false
  }
}

const validateReview = () => {
  reviewErrors.value = {}
  
  if (!newReview.value.rating) {
    reviewErrors.value.rating = 'Please select a rating'
  }
  
  if (!newReview.value.title.trim()) {
    reviewErrors.value.title = 'Review title is required'
  }
  
  if (!newReview.value.comment.trim()) {
    reviewErrors.value.comment = 'Review comment is required'
  }
  
  return Object.keys(reviewErrors.value).length === 0
}

const submitReview = async () => {
  if (!validateReview()) return

  try {
    isSubmittingReview.value = true
    await productStore.submitReview(product.value.id, newReview.value)
    
    // Reset form
    newReview.value = { rating: 0, title: '', comment: '' }
    
    // Reload reviews
    await loadReviews()
    
    showSuccessToast('Review submitted successfully!')
  } catch (error) {
    console.error('Error submitting review:', error)
    showWarningToast('Failed to submit review')
  } finally {
    isSubmittingReview.value = false
  }
}

const deleteReview = async (reviewId) => {
  if (!confirm('Are you sure you want to delete this review?')) return

  try {
    await productStore.removeReview(product.value.id, reviewId)
    await loadReviews()
    showSuccessToast('Review deleted successfully!')
  } catch (error) {
    console.error('Error deleting review:', error)
    showWarningToast('Failed to delete review')
  }
}

const editReview = (review) => {
  newReview.value = {
    rating: review.rating,
    title: review.title,
    comment: review.comment
  }
  
  // Scroll to review form
  document.querySelector('.write-review-section').scrollIntoView({
    behavior: 'smooth'
  })
}

const isUserReview = (review) => {
  return review.userId === authStore.user?.id
}

const getRatingPercentage = (rating) => {
  if (!reviewSummary.value) return 0
  const count = reviewSummary.value.ratingDistribution[rating] || 0
  return (count / reviewSummary.value.totalReviews) * 100
}

const getRatingCount = (rating) => {
  if (!reviewSummary.value) return 0
  return reviewSummary.value.ratingDistribution[rating] || 0
}

const changePage = (page) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page
    loadReviews()
  }
}

// Lifecycle
onMounted(() => {
  loadProduct()
})

// Watch for route changes
watch(() => route.params.id, () => {
  loadProduct()
})
</script>

<style scoped>
.product-detail-container {
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.loading-container,
.error-container {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-secondary);
}

.breadcrumb-nav {
  margin-bottom: var(--spacing-lg);
}

.product-content {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.product-header {
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--color-border-light);
}

.product-image-container {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.product-image {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.product-info {
  padding-left: var(--spacing-lg);
}

.product-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.product-category {
  margin-bottom: var(--spacing-md);
}

.product-rating {
  margin-bottom: var(--spacing-md);
}

.product-price {
  margin-bottom: var(--spacing-lg);
}

.price-amount {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.product-stock {
  margin-bottom: var(--spacing-lg);
}

.stock-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-lg);
}

.product-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.quantity-input {
  width: 80px;
  text-align: center;
}

.product-tabs {
  padding: var(--spacing-xl);
}

.tab-content {
  margin-top: var(--spacing-lg);
}

.description-content h3 {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.description-text {
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}

.reviews-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.review-summary {
  background: var(--color-bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
}

.overall-rating {
  text-align: center;
}

.rating-score {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.rating-count {
  color: var(--color-text-secondary);
  margin-top: var(--spacing-sm);
}

.rating-breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.rating-label {
  min-width: 60px;
  font-size: var(--font-size-sm);
}

.rating-progress {
  flex: 1;
  height: 8px;
  background: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--color-warning);
  transition: width 0.3s ease;
}

.write-review-section {
  background: var(--color-bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
}

.write-review-section h4 {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.review-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.reviews-list h4 {
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
}

.no-reviews {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.review-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.review-item {
  background: var(--color-bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  border-left: 4px solid var(--color-primary);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.reviewer-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.review-date {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.review-title {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.review-comment {
  color: var(--color-text-secondary);
  line-height: var(--line-height-normal);
  margin-bottom: var(--spacing-md);
}

.review-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.pagination-container {
  margin-top: var(--spacing-lg);
}

@media (max-width: 768px) {
  .product-detail-container {
    padding: var(--spacing-md);
  }
  
  .product-header {
    padding: var(--spacing-md);
  }
  
  .product-info {
    padding-left: 0;
    margin-top: var(--spacing-lg);
  }
  
  .product-title {
    font-size: var(--font-size-2xl);
  }
  
  .product-tabs {
    padding: var(--spacing-md);
  }
  
  .review-header {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .quantity-selector {
    flex-direction: column;
    align-items: stretch;
  }
}
</style> 