<template>
  <div class="dashboard">
    <!-- Persistent Sidebar -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div class="header-title">
            <h1>Product Management</h1>
            <p>Manage your product catalog</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" @click="openCreateModal">
              <i class="bi bi-plus-circle me-2"></i>
              Add Product
            </button>
          </div>
        </div>
      </div>

      <!-- Enhanced Stats Dashboard -->
      <div class="stats-dashboard">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-box-seam"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-number">{{ totalProducts }}</h3>
            <p class="stat-label">Total Products</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon warning">
            <i class="bi bi-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-number">{{ lowStockProducts.length }}</h3>
            <p class="stat-label">Low Stock</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon danger">
            <i class="bi bi-x-circle"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-number">{{ zeroStockProducts.length }}</h3>
            <p class="stat-label">Out of Stock</p>
          </div>
        </div>
        

      </div>

      <!-- Enhanced Alerts -->
      <div v-if="lowStockProducts.length > 0" class="alert-section">
        <div class="alert-card warning">
          <div class="alert-icon">
            <i class="bi bi-exclamation-triangle-fill"></i>
          </div>
          <div class="alert-content">
            <h4>Low Stock Alert</h4>
            <p>{{ lowStockProducts.length }} product{{ lowStockProducts.length > 1 ? 's' : '' }} {{ lowStockProducts.length > 1 ? 'have' : 'has' }} less than 5 items in stock.</p>
          </div>
          <div class="alert-actions">
            <AppButton
              variant="outline-warning"
              size="sm"
              @click="showLowStockModal = true"
            >
              View Details
            </AppButton>
          </div>
        </div>
      </div>

      <div v-if="zeroStockProducts.length > 0" class="alert-section">
        <div class="alert-card danger">
          <div class="alert-icon">
            <i class="bi bi-exclamation-triangle-fill"></i>
          </div>
          <div class="alert-content">
            <h4>Zero Stock Alert</h4>
            <p>{{ zeroStockProducts.length }} product{{ zeroStockProducts.length > 1 ? 's' : '' }} {{ zeroStockProducts.length > 1 ? 'have' : 'has' }} no stock and are hidden from customers.</p>
          </div>
          <div class="alert-actions">
            <AppButton
              variant="outline-danger"
              size="sm"
              @click="showZeroStockModal = true"
            >
              Manage Zero Stock
            </AppButton>
          </div>
        </div>
      </div>

      <!-- Enhanced Products List -->
      <div class="products-section">
        <ProductList
          :show-add-to-cart="false"
          :is-admin="true"
          @product-click="openEditModal"
          @delete-product="openDeleteModal"
        />
      </div>
    </div>

    <!-- Enhanced Create Product Modal -->
    <div
      v-if="showCreateModal"
      class="custom-modal"
      @click.self="closeCreateModal"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title-section">
              <h5 class="modal-title">
                <i class="bi bi-plus-circle me-2"></i>
                Create New Product
              </h5>
              <p class="modal-subtitle">Add a new product to your catalog</p>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="closeCreateModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <ProductForm
              @submit="handleCreateProduct"
              @cancel="closeCreateModal"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Edit Product Modal -->
    <div
      v-if="showEditModal && selectedProduct"
      class="custom-modal"
      @click.self="closeEditModal"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title-section">
              <h5 class="modal-title">
                <i class="bi bi-pencil-square me-2"></i>
                Edit Product
              </h5>
              <p class="modal-subtitle">{{ selectedProduct.name }}</p>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="closeEditModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <ProductForm
              :product="selectedProduct"
              :is-edit="true"
              @submit="handleUpdateProduct"
              @cancel="closeEditModal"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Zero Stock Modal -->
    <div
      v-if="showZeroStockModal"
      class="custom-modal"
      @click.self="closeZeroStockModal"
    >
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title-section">
              <h5 class="modal-title">
                <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>
                Zero Stock Products Management
              </h5>
              <p class="modal-subtitle">Manage products with no inventory</p>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="closeZeroStockModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="zero-stock-intro mb-4">
              <div class="info-card">
                <i class="bi bi-info-circle me-2"></i>
                <div>
                  <strong>Note:</strong> These products have 0 stock and are automatically hidden from customers. 
                  You can either restock them or delete them permanently.
                </div>
              </div>
            </div>
            
            <div class="zero-stock-table">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="product in zeroStockProducts" :key="product.id">
                    <td>
                      <div class="product-info-cell">
                        <img 
                          :src="getProductImage(product)" 
                          :alt="product.name"
                          class="product-thumbnail"
                        />
                        <div>
                          <strong>{{ product.name }}</strong>
                          <br>
                          <small class="text-muted">{{ product.description }}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge bg-secondary">
                        {{ getCategoryName(product) }}
                      </span>
                    </td>
                    <td>
                      <strong>€{{ formatPrice(product.price) }}</strong>
                    </td>
                    <td>
                      <small>{{ formatDate(product.modifiedDate) }}</small>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <AppButton
                          variant="success"
                          size="sm"
                          icon="bi-plus-circle"
                          @click="restockProduct(product)"
                        >
                          Restock
                        </AppButton>
                        <AppButton
                          variant="danger"
                          size="sm"
                          icon="bi-trash"
                          @click="deleteZeroStockProduct(product)"
                        >
                          Delete
                        </AppButton>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <AppButton
              variant="outline-secondary"
              @click="closeZeroStockModal"
            >
              Close
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Low Stock Modal -->
    <div
      v-if="showLowStockModal"
      class="custom-modal"
      @click.self="closeLowStockModal"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title-section">
              <h5 class="modal-title">
                <i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                Low Stock Products
              </h5>
              <p class="modal-subtitle">Products requiring restocking</p>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="closeLowStockModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="low-stock-products">
              <div
                v-for="product in lowStockProducts"
                :key="product.id"
                class="low-stock-item"
              >
                <div class="product-info">
                  <div class="product-details">
                    <h6 class="product-name">{{ product.name }}</h6>
                    <p class="product-category">
                      Category: {{ getCategoryName(product) }}
                    </p>
                    <p class="product-price">€{{ formatPrice(product.price) }}</p>
                  </div>
                  <div class="stock-info">
                                <div class="stock-badge" :class="getStockBadgeClass(product.stockQuantity || product.stock_quantity || 0)">
              {{ product.stockQuantity || product.stock_quantity || 0 }} in stock
            </div>
                    <div class="stock-actions">
                      <AppButton
                        variant="primary"
                        size="sm"
                        icon="bi-pencil"
                        @click="editLowStockProduct(product)"
                      >
                        Edit Stock
                      </AppButton>
                      <AppButton
                        variant="danger"
                        size="sm"
                        icon="bi-trash"
                        @click="deleteLowStockProduct(product)"
                      >
                        Delete
                      </AppButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <AppButton
              variant="outline-secondary"
              @click="closeLowStockModal"
            >
              Close
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="custom-modal"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title-section">
              <h5 class="modal-title">
                <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>
                Confirm Delete
              </h5>
              <p class="modal-subtitle">This action cannot be undone</p>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="closeDeleteModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="delete-confirmation">
              <div class="product-preview">
                <img 
                  :src="getProductImage(selectedProduct)" 
                  :alt="selectedProduct?.name"
                  class="product-image"
                />
                <div class="product-details">
                  <h6>{{ selectedProduct?.name }}</h6>
                  <p class="text-muted">{{ selectedProduct?.description }}</p>
                </div>
              </div>
              <div class="warning-message">
                <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>
                Are you sure you want to delete this product? This action cannot be undone.
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <AppButton
              variant="outline-secondary"
              @click="closeDeleteModal"
            >
              Cancel
            </AppButton>
            <AppButton
              variant="danger"
              :loading="isDeleting"
              icon="bi-trash"
              @click="confirmDelete"
            >
              Delete Product
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import ProductList from '@/features/products/components/ProductList.vue'
import ProductForm from '@/features/products/components/ProductForm.vue'
import AppButton from '@/ui/atoms/AppButton.vue'
import { useProductStore } from '@/stores/products'
import { useAuthStore } from '@/stores/auth'
import { showSuccessToast, showWarningToast, showErrorToast } from '@/services/api'
import { checkBackendStatus } from '@/services/backendStatus'

const productStore = useProductStore()
const authStore = useAuthStore()

// User data
const user = computed(() => authStore.user)





// Computed properties
const totalProducts = computed(() => productStore.products.length)

const inStockProducts = computed(() => {
  return productStore.products.filter(product => (product.stockQuantity || product.stock_quantity || 0) > 5).length
})

const lowStockProducts = computed(() => {
  return productStore.products.filter(product => {
    const stock = product.stockQuantity || product.stock_quantity || 0
    return stock < 5 && stock > 0
  })
})

const zeroStockProducts = computed(() => {
  return productStore.products.filter(product => (product.stockQuantity || product.stock_quantity || 0) === 0)
})

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showLowStockModal = ref(false)
const showZeroStockModal = ref(false)
const selectedProduct = ref(null)
const isDeleting = ref(false)

// Methods
const openCreateModal = () => {
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
}

const openEditModal = (product) => {
  selectedProduct.value = product
  showEditModal.value = true
}

const closeEditModal = () => {
  selectedProduct.value = null
  showEditModal.value = false
}

const openDeleteModal = (product) => {
  selectedProduct.value = product
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  selectedProduct.value = null
  showDeleteModal.value = false
}

const handleCreateProduct = async ({ productData, imageFile }) => {
  console.log('=== HANDLE CREATE PRODUCT CALLED ===')
  console.log('Product data:', productData)
  console.log('Image file:', imageFile)
  
  // Enhanced debugging for authentication
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.roles?.includes('ROLE_ADMIN')
  
  console.log('=== AUTHENTICATION DEBUG ===')
  console.log('Token exists:', !!token)
  console.log('Token length:', token?.length)
  console.log('Raw user from localStorage:', user)
  console.log('User roles:', user.roles)
  console.log('Is admin:', isAdmin)
  console.log('Auth store user:', authStore.user)
  console.log('Auth store user roles:', authStore.user?.roles)
  
  // Debug JWT token structure
  if (token) {
    try {
      const tokenParts = token.split('.')
      console.log('Token parts count:', tokenParts.length)
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')))
        console.log('JWT Payload:', payload)
        console.log('JWT Roles:', payload.roles)
        console.log('JWT Authorities:', payload.authorities)
      }
    } catch (error) {
      console.error('Error parsing JWT token:', error)
    }
  }
  
  if (!isAdmin) {
    console.error('User is not an admin')
    showWarningToast('You need admin privileges to create products')
    return
  }
  
  // Check backend status before making the request
  console.log('=== BACKEND STATUS CHECK ===')
  const backendAvailable = await checkBackendStatus()
  console.log('Backend available:', backendAvailable)
  
  if (!backendAvailable) {
    showWarningToast('Backend services are not available. Please check if the server is running.')
    return
  }
  
  // Test authentication with a simple GET request
  console.log('=== AUTHENTICATION TEST ===')
  try {
    const testResponse = await fetch('/api/products', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    console.log('Test request status:', testResponse.status)
    console.log('Test request headers:', testResponse.headers)
  } catch (error) {
    console.error('Test request failed:', error)
  }
  
  // Debug image file specifically
  console.log('=== IMAGE FILE DEBUG ===')
  if (imageFile) {
    console.log('Image file details:', {
      name: imageFile.name,
      type: imageFile.type,
      size: imageFile.size,
      sizeMB: (imageFile.size / (1024 * 1024)).toFixed(2)
    })
  } else {
    console.log('No image file provided')
  }
  
  try {
    await productStore.createNewProduct(productData, imageFile)
    closeCreateModal()
    showSuccessToast('Product created successfully!')
  } catch (error) {
    console.error('Error creating product:', error)
    console.error('Error response:', error.response)
    console.error('Error status:', error.response?.status)
    console.error('Error data:', error.response?.data)
    
    if (error.response?.status === 403) {
      showWarningToast('Access denied. You need admin privileges to create products.')
    } else if (error.response?.status === 401) {
      showWarningToast('Authentication failed. Please log in again.')
    } else if (error.response?.status === 500) {
      showWarningToast('Server error. Please try again later.')
    } else {
      showWarningToast(`Failed to create product: ${error.message}`)
    }
  }
}

const handleUpdateProduct = async ({ productData, imageFile }) => {
  console.log('=== HANDLE UPDATE PRODUCT CALLED ===')
  console.log('Product data:', productData)
  console.log('Image file:', imageFile)
  console.log('Selected product ID:', selectedProduct.value?.id)
  
  // Debug the productData structure
  console.log('=== PRODUCT DATA DEBUG ===')
  console.log('productData type:', typeof productData)
  console.log('productData keys:', Object.keys(productData))
  console.log('productData.stockQuantity:', productData.stockQuantity)
  console.log('productData.stock_quantity:', productData.stock_quantity)
  console.log('productData.stockQuantity type:', typeof productData.stockQuantity)
  console.log('JSON.stringify(productData):', JSON.stringify(productData))
  
  // Check if user is admin
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.roles?.includes('ROLE_ADMIN')
  
  console.log('=== AUTHENTICATION DEBUG ===')
  console.log('Raw user from localStorage:', user)
  console.log('User roles:', user.roles)
  console.log('Is admin:', isAdmin)
  console.log('Auth store user:', authStore.user)
  console.log('Auth store user roles:', authStore.user?.roles)
  
  if (!isAdmin) {
    console.error('❌ USER IS NOT AN ADMIN - BLOCKING UPDATE')
    showWarningToast('You need admin privileges to update products. Current roles: ' + (user.roles?.join(', ') || 'None'))
    return
  }
  
  console.log('✅ USER IS ADMIN - PROCEEDING WITH UPDATE')
  
  try {
    await productStore.updateExistingProduct(selectedProduct.value.id, productData, imageFile)
    closeEditModal()
    showSuccessToast('Product updated successfully!')
  } catch (error) {
    console.error('Error updating product:', error)
    if (error.response?.status === 403) {
      showWarningToast('Access denied. You need admin privileges to update products.')
    } else {
      showWarningToast('Failed to update product')
    }
  }
}

const confirmDelete = async () => {
  if (!selectedProduct.value) return

  try {
    isDeleting.value = true
    await productStore.deleteExistingProduct(selectedProduct.value.id)
    closeDeleteModal()
    showSuccessToast('Product deleted successfully!')
  } catch (error) {
    console.error('Error deleting product:', error)
    showWarningToast('Failed to delete product')
  } finally {
    isDeleting.value = false
  }
}

// Low stock methods
const closeLowStockModal = () => {
  showLowStockModal.value = false
}

const editLowStockProduct = (product) => {
  selectedProduct.value = product
  showLowStockModal.value = false
  showEditModal.value = true
}

const deleteLowStockProduct = (product) => {
  selectedProduct.value = product
  showLowStockModal.value = false
  showDeleteModal.value = true
}

const getCategoryName = (product) => {
  // Check if product has a category object
  if (product.category && product.category.name) {
    return product.category.name
  }
  
  // Check if product has categoryId
  if (product.categoryId) {
    const category = productStore.categories.find(cat => cat.id === product.categoryId)
    if (category) {
      return category.name
    }
  }
  
  // Check if product has category_id
  if (product.category_id) {
    const category = productStore.categories.find(cat => cat.id === product.category_id)
    if (category) {
      return category.name
    }
  }
  
  return 'Unknown Category'
}

const formatPrice = (price) => {
  return Number(price).toFixed(2)
}

const getStockBadgeClass = (stockQuantity) => {
  if (stockQuantity === 0) return 'out-of-stock'
  if (stockQuantity <= 2) return 'critical-stock'
  if (stockQuantity <= 5) return 'low-stock'
  return 'normal-stock'
}

const closeZeroStockModal = () => {
  showZeroStockModal.value = false
}

const restockProduct = (product) => {
  selectedProduct.value = product
  showZeroStockModal.value = false
  showEditModal.value = true
}

const deleteZeroStockProduct = (product) => {
  selectedProduct.value = product
  showZeroStockModal.value = false
  showDeleteModal.value = true
}

const getProductImage = (product) => {
  return product?.imageUrl || product?.image_url || '/placeholder-product.jpg'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(async () => {
  // Debug authentication status
  console.log('=== AUTHENTICATION STATUS ON MOUNT ===')
  console.log('Auth store user:', authStore.user)
  console.log('Auth store token:', authStore.token)
  console.log('Auth store isAuthenticated:', authStore.isAuthenticated)
  console.log('localStorage user:', localStorage.getItem('user'))
  console.log('localStorage token:', localStorage.getItem('token'))
  
  await productStore.initialize()
  
  // Show low stock notification if there are low stock products
  if (lowStockProducts.value.length > 0) {
    showWarningToast(`⚠️ Low Stock Alert: ${lowStockProducts.value.length} product${lowStockProducts.value.length > 1 ? 's' : ''} have less than 5 items in stock!`)
  }
  
  // Show zero stock notification if there are zero stock products
  if (zeroStockProducts.value.length > 0) {
    showWarningToast(`🚨 Zero Stock Alert: ${zeroStockProducts.value.length} product${zeroStockProducts.value.length > 1 ? 's' : ''} have no stock and are hidden from customers!`)
  }
})

// Watch for modal state changes to manage body scroll
watch(showCreateModal, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

watch(showEditModal, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.dashboard {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.main-content {
  flex: 1;
  margin-left: 250px;
  padding: 0;
}

/* Enhanced Header */
.header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
}

.page-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
}

.create-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
}

.create-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

/* Stats Dashboard */
.stats-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  background: var(--primary-color);
}

.stat-icon.warning {
  background: var(--warning-color);
}

.stat-icon.danger {
  background: var(--danger-color);
}

.stat-icon.success {
  background: var(--success-color);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-dark);
}

.stat-label {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 500;
}

/* Alert Sections */
.alert-section {
  padding: 0 2rem;
  max-width: 1400px;
  margin: 0 auto 2rem auto;
}

.alert-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.alert-card.warning {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border-left: 4px solid var(--warning-color);
}

.alert-card.danger {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  border-left: 4px solid var(--danger-color);
}

.alert-icon {
  font-size: 1.5rem;
  color: var(--warning-color);
}

.alert-card.danger .alert-icon {
  color: var(--danger-color);
}

.alert-content {
  flex: 1;
}

.alert-content h4 {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: var(--text-dark);
}

.alert-content p {
  margin: 0;
  color: var(--text-muted);
}

/* Products Section */
.products-section {
  padding: 0 2rem 2rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.section-header h2 {
  margin: 0;
  font-weight: 600;
  color: var(--text-dark);
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box i {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  z-index: 1;
}

.search-input {
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  font-size: 0.9rem;
  min-width: 250px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.1);
}

.category-filter,
.stock-filter {
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  transition: all 0.3s ease;
}

.category-filter:focus,
.stock-filter:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.1);
}

/* Enhanced Modal Styles */
.custom-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.custom-modal .modal-dialog {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;
  border: none;
}

.custom-modal .modal-content {
  border: none;
  border-radius: 16px;
  overflow: hidden;
}

.custom-modal .modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-border-light);
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.modal-title-section {
  flex: 1;
}

.custom-modal .modal-title {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: var(--text-dark);
  display: flex;
  align-items: center;
}

.modal-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.custom-modal .modal-body {
  padding: 2rem;
}

.custom-modal .modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--color-border-light);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background: #f8f9fa;
}

.custom-modal .btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: all 0.3s ease;
  border-radius: 50%;
}

.custom-modal .btn-close:hover {
  color: var(--text-dark);
  background: rgba(0, 0, 0, 0.05);
}

/* Info Card */
.info-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(52, 152, 219, 0.1);
  border: 1px solid rgba(52, 152, 219, 0.2);
  border-radius: 8px;
  color: var(--info-color);
}

/* Delete Confirmation */
.delete-confirmation {
  text-align: center;
}

.product-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
}

.warning-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.2);
  border-radius: 8px;
  color: var(--danger-color);
  font-weight: 500;
}

.delete-confirmation {
  text-align: center;
}

.product-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
}

.product-preview .product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
}

.product-preview .product-details {
  flex: 1;
  text-align: left;
}

.product-preview .product-details h6 {
  margin: 0 0 0.5rem 0;
  color: var(--color-text-primary);
}

.product-preview .product-details p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .stats-dashboard {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 70px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .stats-dashboard {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    min-width: unset;
  }
  
  .alert-card {
    flex-direction: column;
    text-align: center;
  }
  
  .products-section {
    padding: 1rem;
  }
  
  .alert-section {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
}
</style>
