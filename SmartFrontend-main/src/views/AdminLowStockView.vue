<template>
  <div class="dashboard">
    <Sidebar />

    <main class="main-content">
      <!-- Enhanced Header -->
      <div class="dashboard-header">
        <div class="header-left">
          <h1><i class="bi bi-exclamation-triangle-fill me-2 text-warning"></i>Low Stock Management</h1>
          <p class="text-muted">Manage products with quantity less than 5</p>
        </div>
        <div class="header-actions">
          <button @click="refreshData" class="btn btn-outline-primary" :disabled="isLoading">
            <i class="bi bi-arrow-clockwise me-2"></i>
            {{ isLoading ? 'Refreshing...' : 'Refresh' }}
          </button>
          <button @click="exportLowStockReport" class="btn btn-success ms-2">
            <i class="bi bi-download me-2"></i>Export Report
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="loading-container">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading low stock products...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="alert alert-danger my-3">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <strong>Error:</strong> {{ error }}
        <button @click="refreshData" class="btn btn-sm btn-outline-danger ms-3">Try Again</button>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Enhanced Summary Cards -->
        <div class="summary-cards">
          <div class="summary-card critical">
            <div class="summary-icon">
              <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div class="summary-content">
              <h3>Critical Stock</h3>
              <p class="summary-value">{{ criticalStockCount }}</p>
              <span class="summary-label">Products with 0 stock</span>
              <div class="summary-trend">
                <i class="bi bi-arrow-up text-danger"></i>
                <span class="text-danger">Requires immediate attention</span>
              </div>
            </div>
          </div>

          <div class="summary-card warning">
            <div class="summary-icon">
              <i class="bi bi-exclamation-circle"></i>
            </div>
            <div class="summary-content">
              <h3>Low Stock</h3>
              <p class="summary-value">{{ lowStockCount }}</p>
              <span class="summary-label">Products with 1-4 stock</span>
              <div class="summary-trend">
                <i class="bi bi-arrow-up text-warning"></i>
                <span class="text-warning">Needs restocking soon</span>
              </div>
            </div>
          </div>

          <div class="summary-card info">
            <div class="summary-icon">
              <i class="bi bi-box-seam"></i>
            </div>
            <div class="summary-content">
              <h3>Total Products</h3>
              <p class="summary-value">{{ totalProducts }}</p>
              <span class="summary-label">All products in system</span>
              <div class="summary-trend">
                <i class="bi bi-info-circle text-info"></i>
                <span class="text-info">{{ lowStockPercentage }}% need attention</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Products Section -->
        <div class="products-section">
          <div class="section-header">
            <div class="header-left">
              <h2><i class="bi bi-list-ul me-2"></i>Low Stock Products</h2>
              <p class="text-muted mb-0">Showing {{ filteredProducts.length }} of {{ lowStockProducts.length }} low stock products</p>
            </div>
            <div class="header-controls">
              <div class="search-box">
                <i class="bi bi-search"></i>
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="Search products..."
                  class="form-control"
                >
              </div>
              <select v-model="stockFilter" class="form-select">
                <option value="">All Stock Levels</option>
                <option value="critical">Critical (0 stock)</option>
                <option value="low">Low Stock (1-4)</option>
              </select>
              <select v-model="statusFilter" class="form-select">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div class="card">
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-dark">
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Current Stock</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="product in filteredProducts" :key="product.id" :class="getStockRowClass(getStockQuantity(product))">
                      <td>
                        <div class="product-info">
                          <div class="product-image">
                            <img 
                              :src="product.imageUrl || '/placeholder-product.png'" 
                              :alt="product.name"
                              @error="handleImageError"
                            >
                          </div>
                          <div class="product-details">
                            <h6 class="product-name">{{ product.name }}</h6>
                            <small class="text-muted">ID: {{ product.id }}</small>
                            <p class="product-description">{{ product.description || 'No description' }}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="category-badge">{{ getCategoryName(product.category) }}</span>
                      </td>
                      <td>
                        <div class="stock-info">
                          <span :class="getStockBadgeClass(getStockQuantity(product))">
                            {{ getStockQuantity(product) }}
                          </span>
                          <small class="text-muted d-block">units</small>
                          <div class="stock-bar">
                            <div class="stock-fill" :style="{ width: getStockPercentage(getStockQuantity(product)) + '%' }"></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>${{ formatPrice(product.price) }}</strong>
                      </td>
                      <td>
                        <span :class="getStatusBadgeClass(product.status)">
                          {{ product.status || 'active' }}
                        </span>
                      </td>
                      <td>
                        <small class="text-muted">{{ formatDate(product.modifiedDate || product.createdDate) }}</small>
                      </td>
                      <td>
                        <div class="action-buttons">
                          <button 
                            @click="openUpdateStockModal(product)" 
                            class="btn btn-sm btn-primary"
                            title="Update Stock"
                          >
                            <i class="bi bi-plus-circle"></i>
                          </button>
                          <button 
                            @click="openProductModal(product)" 
                            class="btn btn-sm btn-outline-secondary"
                            title="Edit Product"
                          >
                            <i class="bi bi-pencil"></i>
                          </button>
                          <button 
                            @click="deleteProduct(product.id)" 
                            class="btn btn-sm btn-outline-danger"
                            title="Delete Product"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="filteredProducts.length === 0">
                      <td colspan="7" class="text-center py-5">
                        <i class="bi bi-check-circle text-success d-block mb-3" style="font-size: 3rem;"></i>
                        <h5 class="text-success">No Low Stock Products!</h5>
                        <p class="text-muted">All products have sufficient stock levels.</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions Section -->
        <div class="quick-actions-section">
          <h3><i class="bi bi-lightning-charge me-2"></i>Quick Actions</h3>
          <div class="action-buttons">
            <button @click="bulkRestock" class="action-button">
              <i class="bi bi-box-arrow-in-up"></i>
              <span>Bulk Restock</span>
            </button>
            <button @click="generateReport" class="action-button">
              <i class="bi bi-file-earmark-text"></i>
              <span>Generate Report</span>
            </button>
            <button @click="setAlerts" class="action-button">
              <i class="bi bi-bell"></i>
              <span>Set Alerts</span>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Enhanced Update Stock Modal -->
    <div v-if="showUpdateStockModal" class="modal-overlay" @click="closeUpdateStockModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h5><i class="bi bi-plus-circle me-2"></i>Update Stock - {{ selectedProduct?.name }}</h5>
          <button @click="closeUpdateStockModal" class="btn-close"></button>
        </div>
        <div class="modal-body">
          <div class="current-stock-info">
            <div class="stock-summary">
              <div class="current-stock">
                <h6>Current Stock</h6>
                <p class="stock-number">{{ getStockQuantity(selectedProduct) }} units</p>
              </div>
              <div class="stock-status">
                <span :class="getStockBadgeClass(getStockQuantity(selectedProduct))">
                  {{ getStockStatus(getStockQuantity(selectedProduct)) }}
                </span>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Add Stock Quantity:</label>
            <div class="input-group">
              <input 
                v-model.number="newStockQuantity" 
                type="number" 
                min="1" 
                class="form-control"
                placeholder="Enter quantity to add"
              >
              <span class="input-group-text">units</span>
            </div>
            <small class="form-text text-muted">This will add to the current stock level</small>
          </div>
          <div class="preview-info">
            <p><strong>New Total:</strong> {{ getStockQuantity(selectedProduct) + (newStockQuantity || 0) }} units</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeUpdateStockModal" class="btn btn-secondary">Cancel</button>
          <button @click="updateStock" class="btn btn-primary" :disabled="!newStockQuantity || newStockQuantity <= 0">
            <i class="bi bi-check-circle me-2"></i>Update Stock
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Sidebar from '@/components/Sidebar.vue';
import { getAllProducts, updateProduct, deleteProduct as deleteProductAPI } from '@/services/productService';

const router = useRouter();

// Reactive state
const products = ref([]);
const isLoading = ref(true);
const error = ref(null);
const searchQuery = ref('');
const statusFilter = ref('');
const stockFilter = ref('');
const showUpdateStockModal = ref(false);
const selectedProduct = ref(null);
const newStockQuantity = ref(0);

// Helper function to get stock quantity (handles both field names)
const getStockQuantity = (product) => {
  return product?.stockQuantity || product?.stock_quantity || 0;
};

// Computed properties
const lowStockProducts = computed(() => {
  return products.value.filter(product => getStockQuantity(product) < 5);
});

const filteredProducts = computed(() => {
  let filtered = lowStockProducts.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      getCategoryName(product.category).toLowerCase().includes(query)
    );
  }

  if (stockFilter.value) {
    if (stockFilter.value === 'critical') {
      filtered = filtered.filter(product => getStockQuantity(product) === 0);
    } else if (stockFilter.value === 'low') {
      filtered = filtered.filter(product => {
        const stock = getStockQuantity(product);
        return stock > 0 && stock < 5;
      });
    }
  }

  if (statusFilter.value) {
    filtered = filtered.filter(product => 
      (product.status || 'active') === statusFilter.value
    );
  }

  return filtered;
});

const criticalStockCount = computed(() => {
  return products.value.filter(product => getStockQuantity(product) === 0).length;
});

const lowStockCount = computed(() => {
  return products.value.filter(product => {
    const stock = getStockQuantity(product);
    return stock > 0 && stock < 5;
  }).length;
});

const totalProducts = computed(() => products.value.length);

const lowStockPercentage = computed(() => {
  if (totalProducts.value === 0) return 0;
  return Math.round((lowStockProducts.value.length / totalProducts.value) * 100);
});

// Methods
const loadProducts = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const response = await getAllProducts();
    products.value = response.data;
    console.log('📦 Loaded products:', products.value.length);
    console.log('📋 Sample product:', products.value[0]);
  } catch (err) {
    console.error('Error loading products:', err);
    error.value = 'Failed to load products. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const refreshData = () => {
  loadProducts();
};

const openUpdateStockModal = (product) => {
  selectedProduct.value = product;
  newStockQuantity.value = 0;
  showUpdateStockModal.value = true;
};

const closeUpdateStockModal = () => {
  showUpdateStockModal.value = false;
  selectedProduct.value = null;
  newStockQuantity.value = 0;
};

const updateStock = async () => {
  if (!selectedProduct.value || !newStockQuantity.value || newStockQuantity.value <= 0) {
    return;
  }

  try {
    const updatedProduct = {
      ...selectedProduct.value,
      stockQuantity: getStockQuantity(selectedProduct.value) + newStockQuantity.value
    };

    await updateProduct(selectedProduct.value.id, updatedProduct);
    
    // Update local state
    const index = products.value.findIndex(p => p.id === selectedProduct.value.id);
    if (index !== -1) {
      products.value[index] = updatedProduct;
    }

    closeUpdateStockModal();
  } catch (err) {
    console.error('Error updating stock:', err);
    alert('Failed to update stock. Please try again.');
  }
};

const deleteProduct = async (productId) => {
  if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
    return;
  }

  try {
    await deleteProductAPI(productId);
    
    // Remove from local state
    products.value = products.value.filter(p => p.id !== productId);
  } catch (err) {
    console.error('Error deleting product:', err);
    alert('Failed to delete product. Please try again.');
  }
};

const openProductModal = (product) => {
  // Navigate to product edit page
  router.push(`/admin/products/${product.id}/edit`);
};

const handleImageError = (event) => {
  event.target.src = '/placeholder-product.png';
};

// Utility functions
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

const getCategoryName = (category) => {
  if (!category) return 'Uncategorized';
  
  // If category is a string, return it directly
  if (typeof category === 'string') {
    return category;
  }
  
  // If category is an object with a name property, return the name
  if (typeof category === 'object' && category.name) {
    return category.name;
  }
  
  // If category is an object but no name property, try to stringify it
  if (typeof category === 'object') {
    console.warn('Category object without name property:', category);
    return 'Unknown Category';
  }
  
  return 'Uncategorized';
};

const getStockRowClass = (stockQuantity) => {
  const stock = stockQuantity || 0;
  if (stock === 0) return 'table-danger';
  if (stock < 3) return 'table-warning';
  return '';
};

const getStockBadgeClass = (stockQuantity) => {
  const stock = stockQuantity || 0;
  if (stock === 0) return 'badge bg-danger';
  if (stock < 3) return 'badge bg-warning text-dark';
  return 'badge bg-info';
};

const getStockStatus = (stockQuantity) => {
  const stock = stockQuantity || 0;
  if (stock === 0) return 'Out of Stock';
  if (stock < 3) return 'Critical';
  return 'Low Stock';
};

const getStockPercentage = (stockQuantity) => {
  const stock = stockQuantity || 0;
  return Math.min((stock / 5) * 100, 100);
};

const getStatusBadgeClass = (status) => {
  const statusMap = {
    'active': 'badge bg-success',
    'inactive': 'badge bg-secondary',
    'discontinued': 'badge bg-danger'
  };
  return statusMap[status || 'active'] || 'badge bg-secondary';
};

// Additional functionality
const exportLowStockReport = () => {
  console.log('Exporting low stock report...');
  // Implementation for exporting report
};

const bulkRestock = () => {
  console.log('Bulk restock functionality...');
  // Implementation for bulk restock
};

const generateReport = () => {
  console.log('Generating report...');
  // Implementation for generating report
};

const setAlerts = () => {
  console.log('Setting alerts...');
  // Implementation for setting alerts
};

// Lifecycle
onMounted(() => {
  loadProducts();
});
</script>

<style scoped>
.dashboard {
  display: flex;
  height: 100vh;
}

.main-content {
  margin-left: 250px;
  padding: 2rem;
  background-color: var(--bg-muted, #f8f9fa);
  flex-grow: 1;
  overflow-y: auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.header-left h1 {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--text-dark, #2c3e50);
  margin: 0 0 0.5rem 0;
}

.header-left p {
  margin: 0;
  color: var(--text-muted, #6c757d);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

/* Enhanced Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-left: 4px solid;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.summary-card.critical {
  border-left-color: #dc3545;
}

.summary-card.warning {
  border-left-color: #ffc107;
}

.summary-card.info {
  border-left-color: #0dcaf0;
}

.summary-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.5rem;
}

.summary-card.critical .summary-icon {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.summary-card.warning .summary-icon {
  background-color: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

.summary-card.info .summary-icon {
  background-color: rgba(13, 202, 240, 0.1);
  color: #0dcaf0;
}

.summary-content h3 {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-muted, #6c757d);
  margin: 0 0 0.5rem 0;
}

.summary-value {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: var(--text-dark, #2c3e50);
}

.summary-label {
  font-size: 0.875rem;
  color: var(--text-muted, #6c757d);
  margin-bottom: 0.5rem;
}

.summary-trend {
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Enhanced Products Section */
.products-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-dark, #2c3e50);
}

.header-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-box {
  position: relative;
  width: 300px;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted, #6c757d);
}

.search-box input {
  padding-left: 40px;
}

/* Enhanced Product Table */
.product-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.product-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f9fa;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-name {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: var(--text-dark, #2c3e50);
}

.product-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-muted, #6c757d);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 0.375rem;
  background-color: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
  transition: all 0.2s ease;
}

.category-badge:hover {
  background-color: #bbdefb;
  color: #1565c0;
  transform: translateY(-1px);
}

.stock-info {
  text-align: center;
}

.stock-bar {
  width: 60px;
  height: 4px;
  background-color: #e9ecef;
  border-radius: 2px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.stock-fill {
  height: 100%;
  background-color: #28a745;
  transition: width 0.3s ease;
}

.table-danger .stock-fill {
  background-color: #dc3545;
}

.table-warning .stock-fill {
  background-color: #ffc107;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-buttons .btn {
  padding: 0.375rem 0.5rem;
}

/* Quick Actions Section */
.quick-actions-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.quick-actions-section h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--text-dark, #2c3e50);
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
  color: white;
}

.action-button i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.action-button span {
  font-weight: 500;
}

/* Enhanced Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h5 {
  margin: 0;
  font-weight: 600;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.current-stock-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.stock-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-stock h6 {
  margin: 0 0 0.5rem 0;
  color: var(--text-muted, #6c757d);
}

.stock-number {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-dark, #2c3e50);
}

.preview-info {
  background: #e3f2fd;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.preview-info p {
  margin: 0;
  color: #1976d2;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 1200px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 70px;
    padding: 1rem;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-controls {
    width: 100%;
    flex-direction: column;
  }
  
  .search-box {
    width: 100%;
  }
  
  .action-buttons {
    grid-template-columns: 1fr;
  }
}
</style> 