<template>
  <div class="place-order-container">
    <!-- Enhanced Search and Filter Section -->
    <div class="filter-section">
      <div class="search-container">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input
              type="text"
              v-model="searchQuery"
              :placeholder="$t('products.products.searchPlaceholder')"
              class="search-input"
          />
          <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>

      <div class="category-filters">
        <button
            class="category-btn"
            :class="{ active: selectedCategory === null }"
            @click="selectedCategory = null"
        >
          <i class="bi bi-grid-3x3-gap"></i>
          {{ $t('products.products.allProducts') }}
        </button>
        <button
            v-for="category in categories"
            :key="category"
            class="category-btn"
            :class="{ active: selectedCategory === category }"
            @click="selectedCategory = category"
        >
          <i class="bi bi-tag"></i>
          {{ category }}
        </button>
      </div>
    </div>

    <!-- Enhanced Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <p class="loading-text">{{ $t('products.products.loading') }}</p>
    </div>

    <!-- Enhanced Empty State -->
    <div v-else-if="filteredProducts.length === 0" class="no-products">
      <div class="empty-icon">
        <i class="bi bi-search"></i>
      </div>
      <h3 class="empty-title">{{ $t('products.products.noProductsFound') }}</h3>
      <p class="empty-description">Try adjusting your search or filter criteria</p>
      <button class="reset-filters" @click="resetFilters">
        <i class="bi bi-arrow-clockwise"></i>
        Reset Filters
      </button>
    </div>

    <!-- Enhanced Products Grid -->
    <div v-else class="products-grid">
      <div v-for="product in filteredProducts" :key="product.id" class="product-card">
        <!-- Enhanced Product Image -->
        <div class="product-image">
          <img
              :src="imageSrc(product)"
              :alt="product.name"
              loading="lazy"
              @error="onImgError"
              class="product-img"
          />
          <span v-if="product.stock_quantity <= 0" class="stock-badge out-of-stock">
            <i class="bi bi-x-circle"></i>
            {{ $t('products.products.outOfStock') }}
          </span>
          <span v-else-if="product.stock_quantity <= 5" class="stock-badge low-stock">
            <i class="bi bi-exclamation-triangle"></i>
            Low Stock
          </span>
        </div>

        <div class="product-content">
          <!-- Product Header -->
          <div class="product-header">
            <h4 class="product-name" :title="product.name">{{ product.name }}</h4>
            <div class="product-category" v-if="product.category">
              <span class="category-badge">
                <i class="bi bi-tag"></i>
                {{ typeof product.category === 'object' && product.category !== null ? product.category.name : product.category }}
              </span>
            </div>
          </div>

          <!-- Enhanced Product Rating -->
          <div class="product-rating">
            <div class="rating-stars">
              <RatingStars 
                :rating="product.averageRating || 0" 
                :readonly="true"
                :show-text="false"
              />
            </div>
            <div class="rating-info">
              <span class="rating-text" :class="{ 'no-rating': !product.averageRating }">
                {{ product.averageRating ? product.averageRating.toFixed(1) : $t('products.products.noRating') }} / 5.0
              </span>
              <span v-if="product.reviewCount" class="review-count">
                ({{ product.reviewCount }} {{ $t('products.products.reviews') }})
              </span>
            </div>
          </div>
          
          <!-- Rate Product Button -->
          <div class="rate-product-section">
            <button 
              type="button" 
              class="rate-product-btn"
              @click="openRatingModal(product)"
            >
              <i class="bi bi-star"></i>
              {{ $t('products.products.rateThisProduct') }}
            </button>
          </div>

          <!-- Product Description -->
          <p class="product-description">
            {{ product.description || $t('products.products.noDescription') }}
          </p>

          <!-- Product Footer -->
          <div class="product-footer">
            <div class="price-section">
              <span class="product-price">€{{ Number(product.price).toFixed(2) }}</span>
              <span v-if="product.stock_quantity > 0" class="stock-info">
                <i class="bi bi-box"></i>
                {{ product.stock_quantity }} in stock
              </span>
            </div>
            
            <button
                class="add-to-cart-btn"
                :class="{ 
                  'added': isProductInCart(product.id),
                  'disabled': product.stock_quantity <= 0 
                }"
                @click="addToCart(product)"
                :disabled="isProductInCart(product.id) || product.stock_quantity <= 0"
            >
              <i class="bi" :class="isProductInCart(product.id) ? 'bi-check-circle' : 'bi-cart-plus'"></i>
              {{ isProductInCart(product.id) ? $t('products.products.added') : $t('products.products.addToCart') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Rating Modal -->
    <ProductRatingModal
      v-if="isRatingModalOpen && selectedProductForRating"
      :is-open="true"
      :product="selectedProductForRating"
      @close="closeRatingModal"
      @rating-submitted="handleRatingSubmitted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getAllProducts } from '@/services/productservice'
import { useCartStore } from '@/stores/cart'
import RatingStars from '@/ui/atoms/RatingStars.vue'
import ProductRatingModal from '@/components/ProductRatingModal.vue'

const { t } = useI18n()

const props = defineProps({
  cart: { type: Array, required: true }
})

const cartStore = useCartStore()

const router = useRouter()
const products = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref(null)
const isRatingModalOpen = ref(false)
const selectedProductForRating = ref(null)

// ---- Images helpers (supports imageUrl or image_url; uses fallback if missing/blocked) ----
const FALLBACK_IMG =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
       <rect width="100%" height="100%" fill="#f3f4f6"/>
       <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
             font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#9ca3af">
         No image
       </text>
     </svg>`
    )

function imageSrc(p) {
  // Back-end might send "imageUrl" (camel) or "image_url" (snake)
  return p.imageUrl || p.image_url || FALLBACK_IMG
}
function onImgError(e) {
  e.target.src = FALLBACK_IMG
}

// ---- Derived ----
const categories = computed(() => {
  const set = new Set(products.value.map(p => {
    if (typeof p.category === 'object' && p.category !== null) {
      return p.category.name
    }
    return p.category
  }).filter(Boolean))
  return [...set]
})

const filteredProducts = computed(() => {
  // Filter out products with 0 stock first
  let result = products.value.filter(p => p.stock_quantity > 0)

  if (selectedCategory.value) {
    result = result.filter(p => {
      const categoryName = typeof p.category === 'object' && p.category !== null 
        ? p.category.name 
        : p.category
      return categoryName === selectedCategory.value
    })
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
        p =>
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
    )
  }
  return result
})

const cartTotal = computed(() =>
    props.cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
)

// ---- Methods ----
function isProductInCart(productId) {
  return props.cart.some(i => i.id === productId)
}

async function addToCart(product) {
  if (isProductInCart(product.id) || product.stock_quantity <= 0) return

  try {
    console.log('Adding to cart:', { productId: product.id, productName: product.name })
    await cartStore.addItem(product.id, 1)
    // Toast is handled by the cart store, no need for duplicate
  } catch (error) {
    console.error('Error adding to cart:', error)
    // Error toast is handled by the cart store, no need for duplicate
  }
}

function openRatingModal(product) {
  selectedProductForRating.value = product
  isRatingModalOpen.value = true
}

function closeRatingModal() {
  isRatingModalOpen.value = false
  selectedProductForRating.value = null
}

function handleRatingSubmitted(ratingData) {
  console.log('Rating submitted:', ratingData)
  
  // Refresh the product data to show updated average rating
  refreshProductData()
}

function resetFilters() {
  searchQuery.value = ''
  selectedCategory.value = null
}

// Function to refresh product data
async function refreshProductData() {
  try {
    const { data } = await getAllProducts()
    products.value = data
  } catch (err) {
    console.error('Error refreshing products:', err)
  }
}

// ---- Load ----
onMounted(async () => {
  try {
    isLoading.value = true
    const { data } = await getAllProducts()
    products.value = data
  } catch (err) {
    console.error('Error loading products:', err)
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.place-order-container {
  position: relative;
  padding: var(--spacing-lg);
  max-width: 1400px;
  margin: 0 auto;
}

/* Enhanced Filter Section */
.filter-section {
  margin-bottom: var(--spacing-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.search-container {
  display: flex;
  justify-content: center;
}

.search-box {
  position: relative;
  max-width: 600px;
  width: 100%;
}

.search-box i {
  position: absolute;
  left: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-xl) var(--spacing-md) var(--spacing-xl);
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-full);
  font-size: var(--font-size-base);
  background: var(--color-white);
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.clear-search {
  position: absolute;
  right: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--radius-full);
  transition: all var(--transition-normal);
}

.clear-search:hover {
  background: var(--color-gray-100);
  color: var(--color-text-primary);
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  justify-content: center;
}

.category-btn {
  background: var(--color-white);
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-full);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-sm);
}

.category-btn:hover {
  background: var(--color-gray-50);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.category-btn.active {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.category-btn i {
  font-size: var(--font-size-sm);
}

/* Enhanced Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  text-align: center;
}

.loading-spinner {
  margin-bottom: var(--spacing-lg);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--color-gray-200);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  margin: 0;
}

/* Enhanced Empty State */
.no-products {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  text-align: center;
  background: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.empty-icon {
  font-size: 4rem;
  color: var(--color-gray-300);
  margin-bottom: var(--spacing-lg);
}

.empty-title {
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--spacing-sm) 0;
}

.empty-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  margin: 0 0 var(--spacing-xl) 0;
}

.reset-filters {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: all var(--transition-normal);
}

.reset-filters:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

/* Enhanced Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-xl);
}

.product-card {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  position: relative;
  border: 1px solid var(--color-border-light);
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
}

/* Enhanced Product Image */
.product-image {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: var(--color-gray-50);
  overflow: hidden;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}

.product-card:hover .product-img {
  transform: scale(1.05);
}

.stock-badge {
  position: absolute;
  top: var(--spacing-md);
  left: var(--spacing-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.stock-badge.out-of-stock {
  background: var(--color-danger);
  color: var(--color-white);
}

.stock-badge.low-stock {
  background: var(--color-warning);
  color: var(--color-white);
}

/* Product Content */
.product-content {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.product-name {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
  flex: 1;
}

.category-badge {
  background: var(--color-primary-100);
  color: var(--color-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  white-space: nowrap;
}

/* Enhanced Product Rating */
.product-rating {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.rating-stars {
  display: flex;
  align-items: center;
}

.rating-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.rating-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.rating-text.no-rating {
  color: var(--color-gray-400);
  font-style: italic;
}

.review-count {
  color: var(--color-gray-400);
  font-size: var(--font-size-xs);
}

.rate-product-section {
  margin: var(--spacing-sm) 0;
}

.rate-product-btn {
  background: var(--color-gray-100);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  transition: all var(--transition-normal);
}

.rate-product-btn:hover {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.product-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Product Footer */
.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
}

.price-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.product-price {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.stock-info {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.add-to-cart-btn {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-full);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  box-shadow: var(--shadow-sm);
}

.add-to-cart-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.add-to-cart-btn.added {
  background: var(--color-success);
}

.add-to-cart-btn.added:hover {
  background: var(--color-success-dark);
}

.add-to-cart-btn.disabled {
  background: var(--color-gray-300);
  color: var(--color-gray-500);
  cursor: not-allowed;
}

.add-to-cart-btn.disabled:hover {
  transform: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .place-order-container {
    padding: var(--spacing-md);
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-lg);
  }
  
  .cart-summary {
    bottom: var(--spacing-lg);
    right: var(--spacing-lg);
    padding: var(--spacing-md) var(--spacing-lg);
    min-width: 180px;
  }
  
  .category-filters {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: var(--spacing-sm);
  }
  
  .category-btn {
    flex-shrink: 0;
  }
}
</style>
