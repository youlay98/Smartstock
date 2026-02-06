<template>
  <div class="product-list-container">
    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="row align-items-center">
        <div class="col-md-6">
          <div class="search-container">
            <div class="input-group">
              <span class="input-group-text">
                <i class="bi bi-search"></i>
              </span>
              <input
                v-model="searchQuery"
                type="text"
                class="form-control"
                placeholder="Search products..."
                @input="handleSearch"
              />
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="category-filters">
            <div class="category-chips">
              <button
                class="category-chip"
                :class="{ active: selectedCategory === null }"
                @click="selectCategory(null)"
              >
                All Products
              </button>
              <button
                v-for="category in categories"
                :key="category.id"
                class="category-chip"
                :class="{ active: selectedCategory === category.id }"
                @click="selectCategory(category.id)"
              >
                {{ category.name }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3">Loading products...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        {{ error }}
        <button class="btn btn-sm btn-outline-danger ms-3" @click="loadProducts">
          Try Again
        </button>
      </div>
    </div>

    <!-- Products Grid -->
    <div v-else class="products-grid">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="product-card"
        @click="viewProduct(product)"
      >
        <!-- Product Image -->
        <div class="product-image">
          <img
            :src="getProductImage(product)"
            :alt="product.name"
            loading="lazy"
            @error="handleImageError"
          />
          <div class="product-overlay">
            <div class="overlay-actions">
              <button
                v-if="showAddToCart && !isAdmin"
                class="btn btn-sm btn-primary"
                @click.stop="addToCart(product)"
                :disabled="(product.stockQuantity || product.stock_quantity || 0) <= 0"
              >
                <i class="bi bi-cart-plus"></i>
                Add to Cart
              </button>
              <button
                v-if="!isAdmin"
                class="btn btn-sm btn-outline-light"
                @click.stop="viewProduct(product)"
              >
                <i class="bi bi-eye"></i>
                View Details
              </button>
              <!-- Admin Actions -->
              <div v-if="isAdmin" class="admin-actions">
                <button
                  class="btn btn-sm btn-outline-warning"
                  @click.stop="viewProduct(product)"
                  title="Edit Product"
                >
                  <i class="bi bi-pencil"></i>
                  Edit
                </button>
                <button
                  class="btn btn-sm btn-outline-danger"
                  @click.stop="confirmDelete(product)"
                  title="Delete Product"
                >
                  <i class="bi bi-trash"></i>
                  Delete
                </button>
              </div>
            </div>
          </div>
          
          <!-- Stock Badge -->
                      <div v-if="(product.stockQuantity || product.stock_quantity || 0) === 0" class="stock-badge out-of-stock">
              Out of Stock
            </div>
            <div v-else-if="(product.stockQuantity || product.stock_quantity || 0) <= 2" class="stock-badge critical-stock">
              Critical Stock
            </div>
            <div v-else-if="(product.stockQuantity || product.stock_quantity || 0) <= 5" class="stock-badge low-stock">
              Low Stock
            </div>
        </div>

        <!-- Product Info -->
        <div class="product-info">
          <div class="product-header">
            <h5 class="product-name">{{ product.name }}</h5>
            <div class="product-category">
              <span class="badge bg-light text-dark">
                {{ getCategoryName(product) }}
              </span>
            </div>
          </div>

          <p class="product-description">
            {{ truncateDescription(product.description) }}
          </p>

          <!-- Rating -->
          <div class="product-rating">
            <RatingStars
              :rating="product.averageRating || 0"
              :count="product.reviewCount || 0"
              readonly
              show-count
            />
          </div>

          <div class="product-footer">
            <div class="product-price">
              €{{ formatPrice(product.price) }}
            </div>
            
            <div class="product-stock">
              <small class="text-muted">
                {{ product.stockQuantity || product.stock_quantity || 0 }} in stock
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && !error && filteredProducts.length === 0" class="empty-state">
      <i class="bi bi-box text-muted"></i>
      <h3>No Products Found</h3>
      <p>
        {{ searchQuery || selectedCategory 
          ? 'No products match your search criteria. Try adjusting your filters.' 
          : 'There are no products available at the moment.' 
        }}
      </p>
      <button
        v-if="searchQuery || selectedCategory"
        class="btn btn-outline-primary"
        @click="clearFilters"
      >
        Clear Filters
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useProductStore } from '@/stores/products'
import { useCartStore } from '@/stores/cart'
import RatingStars from '@/ui/atoms/RatingStars.vue'
import { showSuccessToast, showWarningToast } from '@/services/api'

const props = defineProps({
  showAddToCart: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['product-click', 'delete-product'])

const productStore = useProductStore()
const cartStore = useCartStore()

// Local state
const searchQuery = ref('')
const selectedCategory = ref(null)
const searchTimeout = ref(null)

// Computed
const categories = computed(() => productStore.categories)
const products = computed(() => productStore.products)
const isLoading = computed(() => productStore.isLoading)
const error = computed(() => productStore.error)

const filteredProducts = computed(() => {
  let filtered = products.value

  // Filter by category
  if (selectedCategory.value !== null) {
    filtered = filtered.filter(p => p.categoryId === selectedCategory.value)
  }

  // Filter by search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      getCategoryName(p).toLowerCase().includes(query)
    )
  }

  return filtered
})

// Methods
const loadProducts = async () => {
  await productStore.loadProducts()
}

const handleSearch = () => {
  // Debounce search
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  searchTimeout.value = setTimeout(() => {
    productStore.setFilters({ search: searchQuery.value })
  }, 300)
}

const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId
  productStore.setFilters({ categoryId })
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = null
  productStore.clearFilters()
}

const getProductImage = (product) => {
  return product.imageUrl || '/placeholder-product.jpg'
}

const handleImageError = (event) => {
  event.target.src = '/placeholder-product.jpg'
}

const getCategoryName = (product) => {
  console.log('=== CATEGORY NAME DEBUG ===')
  console.log('Product:', product)
  console.log('Available categories:', categories.value)
  
  // Check if product has a category object
  if (product.category && product.category.name) {
    console.log('Found category from product.category:', product.category)
    return product.category.name
  }
  
  // Check if product has categoryId
  if (product.categoryId) {
    const category = categories.value.find(c => c.id === product.categoryId)
    console.log('Found category from categoryId:', category)
    if (category) {
      return category.name
    }
  }
  
  // Check if product has category_id
  if (product.category_id) {
    const category = categories.value.find(c => c.id === product.category_id)
    console.log('Found category from category_id:', category)
    if (category) {
      return category.name
    }
  }
  
  console.warn('No category found for product:', product)
  return 'Uncategorized'
}

const truncateDescription = (description) => {
  if (!description) return 'No description available'
  return description.length > 100 
    ? description.substring(0, 100) + '...' 
    : description
}

const formatPrice = (price) => {
  return Number(price).toFixed(2)
}

const viewProduct = (product) => {
  emit('product-click', product)
}

const addToCart = async (product) => {
      if ((product.stockQuantity || product.stock_quantity || 0) <= 0) {
    showWarningToast('This product is out of stock')
    return
  }

  try {
    await cartStore.addItem(product.id, 1)
    showSuccessToast(`${product.name} added to cart!`)
  } catch (error) {
    console.error('Error adding to cart:', error)
  }
}

const confirmDelete = (product) => {
  emit('delete-product', product)
}

// Lifecycle
onMounted(async () => {
  await loadProducts()
})

// Watch for store changes
watch(() => productStore.filters, (newFilters) => {
  searchQuery.value = newFilters.search || ''
  selectedCategory.value = newFilters.categoryId || null
}, { deep: true })
</script>

<style scoped>
.product-list-container {
  padding: var(--spacing-lg);
}

.filters-section {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.search-container {
  margin-bottom: var(--spacing-md);
}

.category-filters {
  display: flex;
  justify-content: flex-end;
}

.category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.category-chip {
  padding: var(--spacing-xs) var(--spacing-md);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-full);
  background: var(--color-white);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.category-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.category-chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.loading-container,
.error-container,
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-secondary);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.product-card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: var(--transition-fast);
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.product-image {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition-fast);
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: var(--transition-fast);
}

.product-card:hover .product-overlay {
  opacity: 1;
}

.overlay-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.admin-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-direction: column;
}

.admin-actions .btn {
  font-size: var(--font-size-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
}

.stock-badge {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
}

.stock-badge.low-stock {
  background: var(--color-warning);
}

.stock-badge.critical-stock {
  background: var(--color-danger);
  animation: pulse 2s infinite;
}

.stock-badge.out-of-stock {
  background: var(--color-gray-500);
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

.product-info {
  padding: var(--spacing-md);
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.product-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
  margin-right: var(--spacing-sm);
}

.product-category {
  flex-shrink: 0;
}

.product-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
  line-height: var(--line-height-normal);
}

.product-rating {
  margin-bottom: var(--spacing-md);
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.product-stock {
  text-align: right;
}

@media (max-width: 768px) {
  .product-list-container {
    padding: var(--spacing-md);
  }
  
  .filters-section {
    padding: var(--spacing-md);
  }
  
  .category-filters {
    justify-content: flex-start;
    margin-top: var(--spacing-md);
  }
  
  .products-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .product-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
  
  .product-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
}
</style> 