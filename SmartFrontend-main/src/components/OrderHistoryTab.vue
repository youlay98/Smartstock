<template>
  <div class="order-history-container">
    <!-- Header Section -->
    <div class="history-header">
      <div class="header-content">
        <div class="header-icon">
          <i class="bi bi-clock"></i>
        </div>
        <div class="header-text">
          <h2 class="page-title">Order History</h2>
          <p class="page-description">Track your past orders and their current status</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="refresh-btn" @click="loadOrders" :disabled="isLoading">
          <i class="bi bi-arrow-clockwise" :class="{ 'spinning': isLoading }"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <p class="loading-text">Loading your order history...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="error-state">
      <div class="error-icon">
        <i class="bi bi-exclamation-triangle"></i>
      </div>
      <h3 class="error-title">Unable to load orders</h3>
      <p class="error-message">{{ loadError }}</p>
      <button class="retry-btn" @click="loadOrders">
        <i class="bi bi-arrow-clockwise"></i>
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!orders.length" class="empty-state">
      <div class="empty-icon">
        <i class="bi bi-inbox"></i>
      </div>
      <h3 class="empty-title">No orders yet</h3>
      <p class="empty-description">You haven't placed any orders yet. Start shopping to see your order history here.</p>
      <button class="start-shopping-btn" @click="goToShopping">
        <i class="bi bi-bag-plus"></i>
        Start Shopping
      </button>
    </div>

    <!-- Orders Table -->
    <div v-else class="orders-section">
      <div class="orders-header">
        <div class="orders-count">
          <span class="count-number">{{ orders.length }}</span>
          <span class="count-text">order{{ orders.length !== 1 ? 's' : '' }} found</span>
        </div>
        <div class="orders-filters">
          <select v-model="statusFilter" class="status-filter">
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div class="orders-table-container">
        <table class="orders-table">
          <thead>
            <tr class="table-header">
              <th class="header-cell">
                <div class="header-content">
                  <i class="bi bi-hash"></i>
                  Order ID
                </div>
              </th>
              <th class="header-cell">
                <div class="header-content">
                  <i class="bi bi-calendar"></i>
                  Date
                </div>
              </th>
              <th class="header-cell">
                <div class="header-content">
                  <i class="bi bi-tag"></i>
                  Status
                </div>
              </th>
              <th class="header-cell">
                <div class="header-content">
                  <i class="bi bi-currency-euro"></i>
                  Total
                </div>
              </th>
              <th class="header-cell">
                <div class="header-content">
                  <i class="bi bi-three-dots"></i>
                  Actions
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="order in filteredOrders" 
              :key="order.id" 
              class="table-row"
              @click="showDetails(order)"
            >
              <td class="table-cell order-id">
                <span class="id-number">#{{ order.id }}</span>
              </td>
              <td class="table-cell order-date">
                <div class="date-content">
                  <span class="date-text">{{ formatDate(order.orderDate) }}</span>
                  <span class="time-text">{{ formatTime(order.orderDate) }}</span>
                </div>
              </td>
              <td class="table-cell order-status">
                <span class="status-badge" :class="getStatusClass(order.status)">
                  <i class="bi" :class="getStatusIcon(order.status)"></i>
                  {{ order.status }}
                </span>
              </td>
              <td class="table-cell order-total">
                <span class="total-amount">€{{ formatPrice(order.totalAmount) }}</span>
              </td>
              <td class="table-cell order-actions">
                <button class="view-details-btn" @click.stop="showDetails(order)">
                  <i class="bi bi-eye"></i>
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- No Results for Filter -->
      <div v-if="filteredOrders.length === 0 && orders.length > 0" class="no-results">
        <div class="no-results-icon">
          <i class="bi bi-search"></i>
        </div>
        <h3 class="no-results-title">No orders match your filter</h3>
        <p class="no-results-description">Try adjusting your status filter to see more orders.</p>
        <button class="clear-filter-btn" @click="statusFilter = ''">
          <i class="bi bi-x-circle"></i>
          Clear Filter
        </button>
      </div>
    </div>

    <!-- Order Details Modal -->
    <OrderDetailsModal 
      v-if="selectedOrder" 
      :order="selectedOrder" 
      @close="selectedOrder = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getOrdersByCustomer } from '@/services/orderService';
import { useAuthStore } from '@/stores/auth';
import OrderDetailsModal from '@/components/OrderDetailsModal.vue';

const props = defineProps({
  profile: {
    type: Object,
    required: true
  }
});

const router = useRouter();
const authStore = useAuthStore();

const orders = ref([]);
const selectedOrder = ref(null);
const isLoading = ref(true);
const loadError = ref(null);
const statusFilter = ref('');

// Load orders when component mounts or profile changes
watch(() => props.profile.id, async (newId) => {
  if (newId) {
    await loadOrders();
  }
}, { immediate: true });

// Filter orders based on status
const filteredOrders = computed(() => {
  if (!statusFilter.value) {
    return orders.value;
  }
  return orders.value.filter(order => order.status === statusFilter.value);
});

async function loadOrders() {
  if (!props.profile.id) {
    console.warn('Cannot load orders: No customer ID available');
    orders.value = [];
    isLoading.value = false;
    return;
  }
  
  try {
    isLoading.value = true;
    loadError.value = null;
    console.log('Loading orders for customer ID:', props.profile.id);
    
    const response = await getOrdersByCustomer(props.profile.id);
    orders.value = response.data || [];
    console.log('Orders loaded successfully:', orders.value.length);
  } catch (error) {
    console.error('Error loading orders:', error);
    loadError.value = 'Failed to load your order history. Please try again later.';
    orders.value = [];
  } finally {
    isLoading.value = false;
  }
}

function showDetails(order) {
  selectedOrder.value = order;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatPrice(price) {
  if (!price) return '0.00';
  return Number(price).toFixed(2);
}

function getStatusClass(status) {
  const statusMap = {
    'PENDING': 'status-pending',
    'CONFIRMED': 'status-confirmed',
    'SHIPPED': 'status-shipped',
    'DELIVERED': 'status-delivered',
    'CANCELLED': 'status-cancelled'
  };
  return statusMap[status] || 'status-default';
}

function getStatusIcon(status) {
  const iconMap = {
    'PENDING': 'bi-clock',
    'CONFIRMED': 'bi-check-circle',
    'SHIPPED': 'bi-truck',
    'DELIVERED': 'bi-box-seam',
    'CANCELLED': 'bi-x-circle'
  };
  return iconMap[status] || 'bi-question-circle';
}

function goToShopping() {
  router.push({ query: { tab: 'placeOrder' } });
}
</script>

<style scoped>
.order-history-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

/* Header Section */
.history-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  padding: var(--spacing-2xl);
  border-radius: var(--radius-2xl);
  margin-bottom: var(--spacing-2xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-lg);
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.header-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  box-shadow: var(--shadow-md);
}

.header-icon i {
  font-size: var(--font-size-2xl);
  color: var(--color-white) !important;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.page-title {
  margin: 0;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.page-description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

.refresh-btn {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: all var(--transition-normal);
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn i.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Loading State */
.loading-state {
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

.loading-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  margin: 0;
}

/* Error State */
.error-state {
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

.error-icon {
  font-size: 4rem;
  color: var(--color-danger);
  margin-bottom: var(--spacing-lg);
}

.error-title {
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--spacing-sm) 0;
}

.error-message {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  margin: 0 0 var(--spacing-xl) 0;
}

.retry-btn {
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

.retry-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

/* Empty State */
.empty-state {
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
  max-width: 400px;
}

.start-shopping-btn {
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

.start-shopping-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

/* Orders Section */
.orders-section {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  border: 1px solid var(--color-border-light);
}

.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-gray-50);
}

.orders-count {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.count-number {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.count-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

.status-filter {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: var(--color-white);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.status-filter:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

/* Orders Table */
.orders-table-container {
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  background: var(--color-gray-50);
}

.header-cell {
  padding: var(--spacing-lg) var(--spacing-xl);
  text-align: left;
  border-bottom: 1px solid var(--color-border-light);
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.header-content i {
  color: var(--color-primary);
}

.table-row {
  transition: all var(--transition-normal);
  cursor: pointer;
}

.table-row:hover {
  background: var(--color-gray-50);
}

.table-cell {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border-light);
  vertical-align: middle;
}

.order-id .id-number {
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  font-family: var(--font-family-mono);
}

.date-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.date-text {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.time-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.status-pending {
  background: var(--color-warning-100);
  color: var(--color-warning-dark);
}

.status-badge.status-confirmed {
  background: var(--color-primary-100);
  color: var(--color-primary-dark);
}

.status-badge.status-shipped {
  background: var(--color-info-100);
  color: var(--color-info-dark);
}

.status-badge.status-delivered {
  background: var(--color-success-100);
  color: var(--color-success-dark);
}

.status-badge.status-cancelled {
  background: var(--color-danger-100);
  color: var(--color-danger-dark);
}

.status-badge.status-default {
  background: var(--color-gray-100);
  color: var(--color-gray-600);
}

.total-amount {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
  color: var(--color-primary);
}

.view-details-btn {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-lg);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  transition: all var(--transition-normal);
}

.view-details-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

/* No Results */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  text-align: center;
}

.no-results-icon {
  font-size: 3rem;
  color: var(--color-gray-300);
  margin-bottom: var(--spacing-lg);
}

.no-results-title {
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--spacing-sm) 0;
}

.no-results-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  margin: 0 0 var(--spacing-xl) 0;
}

.clear-filter-btn {
  background: var(--color-gray-100);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: all var(--transition-normal);
}

.clear-filter-btn:hover {
  background: var(--color-gray-200);
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .order-history-container {
    padding: var(--spacing-md);
  }
  
  .history-header {
    flex-direction: column;
    gap: var(--spacing-lg);
    text-align: center;
  }
  
  .header-content {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .orders-header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }
  
  .orders-table-container {
    font-size: var(--font-size-sm);
  }
  
  .table-cell {
    padding: var(--spacing-md);
  }
  
  .header-cell {
    padding: var(--spacing-md);
  }
  
  .status-badge {
    font-size: var(--font-size-xs);
    padding: var(--spacing-xs);
  }
}
</style>
