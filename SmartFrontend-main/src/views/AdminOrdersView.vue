<template>
  <div class="admin-dashboard">
    <!-- Your persistent sidebar -->
    <Sidebar />

    <div class="main-content">
      <!-- Enhanced Header with Stats -->
      <div class="header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="page-title">
              <i class="bi bi-cart-check me-3"></i>
              Order Management
            </h1>
            <p class="page-subtitle">Manage and track all customer orders</p>
          </div>
        </div>
      </div>

      <!-- Enhanced Orders Section -->
      <div class="orders-section">
        <div class="section-header">
          <h2>Order Catalog</h2>
          <div class="filters">
            <div class="search-box">
              <i class="bi bi-search"></i>
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Search orders by ID or customer..."
                class="search-input"
              />
            </div>
            <select v-model="statusFilter" class="status-filter">
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DELIVERED">Delivered</option>
            </select>
            <select v-model="dateFilter" class="date-filter">
              <option value="">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
          <p class="loading-text">Loading orders...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="loadError" class="error-container">
          <div class="error-card">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <h3>Error Loading Orders</h3>
            <p>{{ loadError }}</p>
            <AppButton
              variant="primary"
              @click="loadOrders"
            >
              Try Again
            </AppButton>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredOrders.length === 0" class="empty-state">
          <div class="empty-card">
            <i class="bi bi-inbox"></i>
            <h3>No Orders Found</h3>
            <p>{{ searchQuery || statusFilter ? 'No orders match your current filters.' : 'There are no orders in the system yet.' }}</p>
            <AppButton
              v-if="searchQuery || statusFilter"
              variant="outline-primary"
              @click="clearFilters"
            >
              Clear Filters
            </AppButton>
          </div>
        </div>

        <!-- Enhanced Orders List -->
        <div v-else class="orders-grid">
          <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="order-card"
            :class="getOrderCardClass(order.status)"
          >
            <div class="order-header">
              <div class="order-id">
                <span class="order-number">#{{ order.id }}</span>
                <span :class="getStatusBadgeClass(order.status)">
                  {{ order.status }}
                </span>
              </div>
              <div class="order-date">
                <i class="bi bi-calendar3"></i>
                {{ formatDate(order.orderDate) }}
              </div>
            </div>
            
            <div class="order-content">
              <div class="customer-info">
                <div class="customer-avatar">
                  <i class="bi bi-person-circle"></i>
                </div>
                <div class="customer-details">
                  <h4>Customer #{{ order.customerId }}</h4>
                  <p class="customer-email">{{ getCustomerEmail(order.customerId) }}</p>
                </div>
              </div>
              
              <div class="order-actions">
                <AppButton
                  v-if="order.status === 'PENDING' || order.status === 'NEW'"
                  variant="success"
                  size="sm"
                  icon="bi-check-circle"
                  @click="confirmOrder(order)"
                >
                  Confirm
                </AppButton>
                <AppButton
                  variant="outline-primary"
                  size="sm"
                  icon="bi-eye"
                  @click="viewOrderDetails(order)"
                >
                  View Details
                </AppButton>
                <AppButton
                  variant="outline-danger"
                  size="sm"
                  icon="bi-trash"
                  @click="handleDeleteOrder(order.id)"
                >
                  Delete
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Details Modal -->
    <div
      v-if="showOrderDetailsModal && selectedOrder"
      class="custom-modal"
      @click.self="closeOrderDetailsModal"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title-section">
              <h5 class="modal-title">
                <i class="bi bi-cart-check me-2"></i>
                Order Details
              </h5>
              <p class="modal-subtitle">Order #{{ selectedOrder.id }}</p>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="closeOrderDetailsModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="order-details">
              <div class="detail-section">
                <h6>Order Information</h6>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Order ID:</span>
                    <span class="detail-value">#{{ selectedOrder.id }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span :class="getStatusBadgeClass(selectedOrder.status)">
                      {{ selectedOrder.status }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Order Date:</span>
                    <span class="detail-value">{{ formatDate(selectedOrder.orderDate) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Customer ID:</span>
                    <span class="detail-value">#{{ selectedOrder.customerId }}</span>
                  </div>
                </div>
              </div>
              
              <div class="detail-section">
                <h6>Customer Information</h6>
                <div class="customer-detail">
                  <div class="customer-avatar-large">
                    <i class="bi bi-person-circle"></i>
                  </div>
                  <div class="customer-info-detail">
                    <h5>{{ getCustomerName(selectedOrder.customerId) }}</h5>
                    <p>{{ getCustomerEmail(selectedOrder.customerId) }}</p>
                    <p>{{ getCustomerPhone(selectedOrder.customerId) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <AppButton
              v-if="selectedOrder.status === 'PENDING' || selectedOrder.status === 'NEW'"
              variant="success"
              icon="bi-check-circle"
              @click="confirmOrderFromModal"
            >
              Confirm Order
            </AppButton>
            <AppButton
              variant="outline-secondary"
              @click="closeOrderDetailsModal"
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
import { ref, onMounted, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Sidebar from '@/components/Sidebar.vue';
import AppButton from '@/ui/atoms/AppButton.vue';
import { getAllOrders, deleteOrder, updateOrder } from '@/services/orderService';
import { getAllCustomers } from '@/services/customerService';
import { showSuccessToast, showWarningToast } from '@/services/api';

const { t, locale, messages } = useI18n();

// Debug: Check if translations are working
console.log('Current locale:', locale.value);
console.log('Available messages:', Object.keys(messages.value));
console.log('Orders messages:', messages.value.orders);
console.log('Translation test:', t('orders.title'));

// Reactive data
const orders = ref([]);
const customers = ref([]);
const isLoading = ref(true);
const loadError = ref(null);
const searchQuery = ref('');
const statusFilter = ref('');
const dateFilter = ref('');
const showOrderDetailsModal = ref(false);
const selectedOrder = ref(null);

// Computed properties
const totalOrders = computed(() => orders.value.length);

const pendingOrders = computed(() => {
  return orders.value.filter(order => 
    order.status === 'PENDING' || order.status === 'NEW'
  ).length;
});

const confirmedOrders = computed(() => {
  return orders.value.filter(order => order.status === 'CONFIRMED').length;
});

const deliveredOrders = computed(() => {
  return orders.value.filter(order => order.status === 'DELIVERED').length;
});

const filteredOrders = computed(() => {
  let filtered = orders.value;

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(order => 
      order.id.toString().includes(query) ||
      order.customerId.toString().includes(query)
    );
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(order => order.status === statusFilter.value);
  }

  // Date filter
  if (dateFilter.value) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    filtered = filtered.filter(order => {
      const orderDate = new Date(order.orderDate);
      switch (dateFilter.value) {
        case 'today':
          return orderDate >= today;
        case 'week':
          return orderDate >= weekAgo;
        case 'month':
          return orderDate >= monthAgo;
        default:
          return true;
      }
    });
  }

  return filtered;
});

// Methods
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusBadgeClass = (status) => {
  const statusMap = {
    'PENDING': 'badge bg-warning text-dark',
    'CONFIRMED': 'badge bg-success',
    'CANCELLED': 'badge bg-danger',
    'DELIVERED': 'badge bg-info',
    'NEW': 'badge bg-secondary'
  };
  
  return statusMap[status] || 'badge bg-secondary';
};

const getOrderCardClass = (status) => {
  const statusMap = {
    'PENDING': 'order-pending',
    'CONFIRMED': 'order-confirmed',
    'CANCELLED': 'order-cancelled',
    'DELIVERED': 'order-delivered'
  };
  
  return statusMap[status] || '';
};

const getCustomerEmail = (customerId) => {
  const customer = customers.value.find(c => c.id === customerId);
  return customer?.email || 'N/A';
};

const getCustomerName = (customerId) => {
  const customer = customers.value.find(c => c.id === customerId);
  return customer?.name || `Customer #${customerId}`;
};

const getCustomerPhone = (customerId) => {
  const customer = customers.value.find(c => c.id === customerId);
  return customer?.phone || 'N/A';
};

const loadOrders = async () => {
  try {
    isLoading.value = true;
    loadError.value = null;
    
    const [ordersResponse, customersResponse] = await Promise.all([
      getAllOrders(),
      getAllCustomers()
    ]);
    
    orders.value = ordersResponse.data;
    customers.value = customersResponse.data;
  } catch (error) {
    console.error('Error loading orders:', error);
    loadError.value = t('orders.loadError');
  } finally {
    isLoading.value = false;
  }
};

const clearFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  dateFilter.value = '';
};

const viewOrderDetails = (order) => {
  selectedOrder.value = order;
  showOrderDetailsModal.value = true;
};

const closeOrderDetailsModal = () => {
  selectedOrder.value = null;
  showOrderDetailsModal.value = false;
};

const confirmOrderFromModal = async () => {
  if (!selectedOrder.value) return;
  
  try {
    await confirmOrder(selectedOrder.value);
    closeOrderDetailsModal();
  } catch (error) {
    console.error('Error confirming order:', error);
  }
};

const handleDeleteOrder = async (id) => {
  if (!confirm(t('orders.confirmDelete'))) {
    return;
  }
  
  try {
    await deleteOrder(id);
    await loadOrders();
    showSuccessToast(t('orders.deleteSuccess'));
  } catch (error) {
    console.error('Error deleting order:', error);
    showWarningToast(t('orders.deleteError'));
  }
};

const confirmOrder = async (order) => {
  try {
    const updatedOrder = {
      id: order.id,
      status: 'CONFIRMED',
    };
    await updateOrder(order.id, updatedOrder);
    await loadOrders();
    showSuccessToast(t('orders.confirmSuccess'));
  } catch (error) {
    console.error('Error confirming order:', error);
    showWarningToast(t('orders.confirmError'));
  }
};

onMounted(async () => {
  await loadOrders();
});
</script>

<style scoped>
.admin-dashboard {
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

.order-stats {
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

.stat-icon.warning {
  background: var(--warning-color);
}

.stat-icon.success {
  background: var(--success-color);
}

.stat-icon.info {
  background: var(--info-color);
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

/* Orders Section */
.orders-section {
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
.date-filter {
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  transition: all 0.3s ease;
}

.status-filter:focus,
.date-filter:focus {
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

/* Orders Grid */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.order-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-left: 4px solid var(--primary-color);
}

.order-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.order-card.order-pending {
  border-left-color: var(--warning-color);
}

.order-card.order-confirmed {
  border-left-color: var(--success-color);
}

.order-card.order-cancelled {
  border-left-color: var(--danger-color);
}

.order-card.order-delivered {
  border-left-color: var(--info-color);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-light);
}

.order-id {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.order-number {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-dark);
}

.order-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.order-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.customer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.customer-details h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: var(--text-dark);
}

.customer-email {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.order-actions {
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

/* Order Details */
.order-details {
  display: flex;
  flex-direction: column;
  gap: 2rem;
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

.customer-detail {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.customer-avatar-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.customer-info-detail h5 {
  margin: 0 0 0.5rem 0;
  color: var(--text-dark);
}

.customer-info-detail p {
  margin: 0 0 0.25rem 0;
  color: var(--text-muted);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .stats-dashboard {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .orders-grid {
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
  
  .order-stats {
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
  
  .orders-grid {
    grid-template-columns: 1fr;
  }
  
  .order-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .order-actions {
    justify-content: center;
  }
  
  .orders-section {
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
  
  .order-card {
    padding: 1rem;
  }
  
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
