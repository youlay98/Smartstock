<template>
  <div class="dashboard">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Enhanced Header with Stats -->
      <div class="header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="page-title">
              <i class="bi bi-people me-3"></i>
              Customer Management
            </h1>
            <p class="page-subtitle">Manage your customer database and relationships</p>
          </div>
        </div>
      </div>

      <!-- Enhanced Stats Dashboard -->
      <div class="stats-dashboard">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-people"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-number">{{ totalCustomers }}</h3>
            <p class="stat-label">Total Customers</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon success">
            <i class="bi bi-person-check"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-number">{{ activeCustomers }}</h3>
            <p class="stat-label">Active Customers</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon info">
            <i class="bi bi-person-plus"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-number">{{ newCustomers }}</h3>
            <p class="stat-label">New This Month</p>
          </div>
        </div>
      </div>

      <!-- Enhanced Customers Section -->
      <div class="customers-section">
        <div class="section-header">
          <h2>Customer Database</h2>
          <div class="filters">
            <div class="search-box">
              <i class="bi bi-search"></i>
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Search customers by name, email, or phone..."
                class="search-input"
              />
            </div>
            <select v-model="sortBy" class="sort-filter">
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="recent">Sort by Recent</option>
            </select>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
          <p class="loading-text">Loading customers...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="loadError" class="error-container">
          <div class="error-card">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <h3>Error Loading Customers</h3>
            <p>{{ loadError }}</p>
            <AppButton
              variant="primary"
              @click="loadCustomers"
            >
              Try Again
            </AppButton>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredCustomers.length === 0" class="empty-state">
          <div class="empty-card">
            <i class="bi bi-people"></i>
            <h3>No Customers Found</h3>
            <p>{{ searchQuery ? 'No customers match your current filters.' : 'There are no customers in the system yet.' }}</p>
            <AppButton
              v-if="searchQuery"
              variant="outline-primary"
              @click="clearFilters"
            >
              Clear Filters
            </AppButton>
          </div>
        </div>

        <!-- Enhanced Customers Grid -->
        <div v-else class="customers-grid">
          <div
            v-for="customer in sortedCustomers"
            :key="customer.id"
            class="customer-card"
            :class="getCustomerCardClass(customer)"
          >
            <div class="customer-header">
              <div class="customer-avatar">
                <i class="bi bi-person-circle"></i>
              </div>
            </div>
            
            <div class="customer-content">
              <div class="customer-info">
                <h4>{{ customer.name }}</h4>
                <p><i class="bi bi-envelope me-2"></i>{{ customer.email }}</p>
                <p><i class="bi bi-telephone me-2"></i>{{ customer.phone || 'N/A' }}</p>
                <p><i class="bi bi-geo-alt me-2"></i>{{ customer.address || 'N/A' }}</p>
              </div>
              
              <div class="customer-actions">
                <AppButton
                  variant="outline-primary"
                  size="sm"
                  icon="bi-eye"
                  @click="viewCustomerDetails(customer)"
                >
                  View Details
                </AppButton>
                <AppButton
                  variant="outline-secondary"
                  size="sm"
                  icon="bi-pencil"
                  @click="openEditModal(customer)"
                >
                  Edit
                </AppButton>
                <AppButton
                  variant="outline-danger"
                  size="sm"
                  icon="bi-trash"
                  @click="handleDeleteCustomer(customer.id)"
                >
                  Delete
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Edit Customer Modal -->
    <div
      v-if="selectedCustomer"
      class="custom-modal"
      @click.self="closeEditModal"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title-section">
              <h5 class="modal-title">
                <i class="bi bi-pencil-square me-2"></i>
                Edit Customer
              </h5>
              <p class="modal-subtitle">{{ selectedCustomer.name }}</p>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="closeEditModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <EditCustomerModal
              :customer="selectedCustomer"
              @updated="handleCustomerUpdated"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Customer Details Modal -->
    <div
      v-if="showCustomerDetailsModal && selectedCustomer"
      class="custom-modal"
      @click.self="closeCustomerDetailsModal"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title-section">
              <h5 class="modal-title">
                <i class="bi bi-person-circle me-2"></i>
                Customer Details
              </h5>
              <p class="modal-subtitle">{{ selectedCustomer.name }}</p>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="closeCustomerDetailsModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="customer-details">
              <div class="customer-profile">
                <div class="customer-avatar-large">
                  <i class="bi bi-person-circle"></i>
                </div>
                <div class="customer-profile-info">
                  <h4>{{ selectedCustomer.name }}</h4>
                </div>
              </div>
              
              <div class="detail-section">
                <h6>Contact Information</h6>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">{{ selectedCustomer.email }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">{{ selectedCustomer.phone || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Address:</span>
                    <span class="detail-value">{{ selectedCustomer.address || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Customer ID:</span>
                    <span class="detail-value">#{{ selectedCustomer.id }}</span>
                  </div>
                </div>
              </div>
              
              <div class="detail-section">
                <h6>Customer Activity</h6>
                <div class="activity-info">
                  <div class="activity-item">
                    <i class="bi bi-calendar3"></i>
                    <div>
                      <strong>Member Since:</strong>
                      <p>{{ formatDate(selectedCustomer.createdAt || selectedCustomer.created_at) }}</p>
                    </div>
                  </div>
                  <div class="activity-item">
                    <i class="bi bi-cart-check"></i>
                    <div>
                      <strong>Total Orders:</strong>
                      <p>{{ getCustomerOrderCount(selectedCustomer.id) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <AppButton
              variant="primary"
              icon="bi-pencil"
              @click="editFromDetails"
            >
              Edit Customer
            </AppButton>
            <AppButton
              variant="outline-secondary"
              @click="closeCustomerDetailsModal"
            >
              Close
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Sidebar from '@/components/Sidebar.vue';
import EditCustomerModal from '@/components/EditCustomerModal.vue';
import AppButton from '@/ui/atoms/AppButton.vue';
import { getAllCustomers, deleteCustomer } from '@/services/customerService';
import { getAllOrders } from '@/services/orderService';
import { showSuccessToast, showWarningToast } from '@/services/api';

const { t, locale } = useI18n();

const customers = ref([]);
const orders = ref([]);
const searchQuery = ref('');
const statusFilter = ref('');
const sortBy = ref('name');
const selectedCustomer = ref(null);
const showCustomerDetailsModal = ref(false);
const isLoading = ref(true);
const loadError = ref(null);

// Computed properties
const totalCustomers = computed(() => customers.value.length);

const activeCustomers = computed(() => {
  return customers.value.filter(customer => isCustomerActive(customer)).length;
});

const inactiveCustomers = computed(() => {
  return customers.value.filter(customer => !isCustomerActive(customer)).length;
});

const newCustomers = computed(() => {
  const now = new Date();
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  
  return customers.value.filter(customer => {
    const createdAt = new Date(customer.createdAt || customer.created_at);
    return createdAt >= monthAgo;
  }).length;
});

const filteredCustomers = computed(() => {
  let filtered = customers.value;

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(customer => 
      customer.name?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.address?.toLowerCase().includes(query)
    );
  }

  return filtered;
});

const sortedCustomers = computed(() => {
  const sorted = [...filteredCustomers.value];
  
  switch (sortBy.value) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'email':
      return sorted.sort((a, b) => a.email.localeCompare(b.email));
    case 'recent':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at);
        const dateB = new Date(b.createdAt || b.created_at);
        return dateB - dateA;
      });
    default:
      return sorted;
  }
});

// Methods
const isCustomerActive = (customer) => {
  // Consider a customer active if they have orders in the last 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const customerOrders = orders.value.filter(order => order.customerId === customer.id);
  return customerOrders.some(order => new Date(order.orderDate) >= threeMonthsAgo);
};

const getCustomerStatus = (customer) => {
  return isCustomerActive(customer) ? 'Active' : 'Inactive';
};

const getCustomerCardClass = (customer) => {
  return isCustomerActive(customer) ? 'customer-active' : 'customer-inactive';
};

const getStatusBadgeClass = (customer) => {
  return isCustomerActive(customer) ? 'badge bg-success' : 'badge bg-danger text-white';
};

const getCustomerOrderCount = (customerId) => {
  return orders.value.filter(order => order.customerId === customerId).length;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const loadCustomers = async () => {
  try {
    isLoading.value = true;
    loadError.value = null;
    
    const [customersResponse, ordersResponse] = await Promise.all([
      getAllCustomers(),
      getAllOrders()
    ]);
    
    customers.value = customersResponse.data;
    orders.value = ordersResponse.data;
  } catch (error) {
    console.error('Error loading customers:', error);
    loadError.value = t('customers.loadError');
  } finally {
    isLoading.value = false;
  }
};

const clearFilters = () => {
  searchQuery.value = '';
  sortBy.value = 'name';
};

const openEditModal = (customer) => {
  selectedCustomer.value = { ...customer };
};

const closeEditModal = () => {
  selectedCustomer.value = null;
};

const viewCustomerDetails = (customer) => {
  selectedCustomer.value = customer;
  showCustomerDetailsModal.value = true;
};

const closeCustomerDetailsModal = () => {
  selectedCustomer.value = null;
  showCustomerDetailsModal.value = false;
};

const editFromDetails = () => {
  showCustomerDetailsModal.value = false;
  // The selectedCustomer is already set, so the edit modal will open
};

const handleCustomerUpdated = async () => {
  await loadCustomers();
  closeEditModal();
  showSuccessToast(t('customers.updateSuccess'));
};

const handleDeleteCustomer = async (id) => {
  if (!confirm(t('customers.confirmDelete'))) {
    return;
  }
  
  try {
    await deleteCustomer(id);
    await loadCustomers();
    showSuccessToast(t('customers.deleteSuccess'));
  } catch (error) {
    console.error('Error deleting customer:', error);
    showWarningToast(t('customers.deleteError'));
  }
};

onMounted(() => {
  loadCustomers();
});
</script>

<style scoped>
.dashboard {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.main-content {
  margin-left: 250px;
  padding: 0;
  flex-grow: 1;
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

.customer-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
  background: rgba(255, 255, 255, 0.15);
  padding: 1rem;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-item .stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.stat-item .stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
  color: white;
  font-weight: 500;
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

.stat-icon.success {
  background: var(--success-color);
}

.stat-icon.info {
  background: var(--info-color);
}

.stat-icon.warning {
  background: var(--warning-color);
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

/* Customers Section */
.customers-section {
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

.status-filter,
.sort-filter {
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  transition: all 0.3s ease;
}

.status-filter:focus,
.sort-filter:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.1);
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-spinner {
  margin-bottom: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: var(--text-muted);
  font-size: 1.1rem;
}

/* Error State */
.error-container {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.error-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  max-width: 400px;
}

.error-card i {
  font-size: 3rem;
  color: var(--danger-color);
  margin-bottom: 1rem;
}

.error-card h3 {
  margin: 0 0 1rem 0;
  color: var(--text-dark);
}

.error-card p {
  margin: 0 0 1.5rem 0;
  color: var(--text-muted);
}

/* Empty State */
.empty-state {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.empty-card {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  max-width: 400px;
}

.empty-card i {
  font-size: 3rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.empty-card h3 {
  margin: 0 0 1rem 0;
  color: var(--text-dark);
}

.empty-card p {
  margin: 0 0 1.5rem 0;
  color: var(--text-muted);
}

/* Customers Grid */
.customers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.customer-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-left: 4px solid var(--primary-color);
}

.customer-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.customer-card.customer-active {
  border-left-color: var(--success-color);
}

.customer-card.customer-inactive {
  border-left-color: var(--text-muted);
}

.customer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-light);
}

.customer-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.customer-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.customer-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: var(--text-dark);
  font-weight: 600;
}

.customer-info p {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

.customer-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Badge Styles */
.badge {
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  border-radius: 30px;
  font-size: 0.8rem;
}

/* Modal Styles */
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

/* Customer Details */
.customer-details {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.customer-profile {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.customer-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
}

.customer-profile-info h4 {
  margin: 0 0 0.5rem 0;
  color: var(--text-dark);
  font-size: 1.5rem;
}

.detail-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
}

.detail-section h6 {
  margin: 0 0 1rem 0;
  font-weight: 600;
  color: var(--text-dark);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.detail-label {
  font-weight: 500;
  color: var(--text-muted);
}

.detail-value {
  font-weight: 600;
  color: var(--text-dark);
}

.activity-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
}

.activity-item i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.activity-item strong {
  display: block;
  color: var(--text-dark);
  margin-bottom: 0.25rem;
}

.activity-item p {
  margin: 0;
  color: var(--text-muted);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .stats-dashboard {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .customers-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
  
  .customer-stats {
    gap: 1rem;
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
  
  .customers-grid {
    grid-template-columns: 1fr;
  }
  
  .customer-content {
    gap: 1rem;
  }
  
  .customer-actions {
    justify-content: center;
  }
  
  .customers-section {
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
  
  .customer-card {
    padding: 1rem;
  }
  
  .customer-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .customer-profile {
    flex-direction: column;
    text-align: center;
  }
}
</style>
