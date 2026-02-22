<template>
  <div class="dashboard">
    <Sidebar />

    <main class="main-content">
      <div class="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div class="header-actions">
          <NotificationBell />
          <div class="user-welcome">
            <span>Welcome,</span>
            <strong>{{ user.username }}</strong>
            <div class="user-avatar">
              <i class="bi bi-person-circle"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="loading-container">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading dashboard data...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="loadError" class="alert alert-danger my-3">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <strong>Error:</strong> {{ loadError }}
        <p>Please try refreshing the page or contact support if the issue persists.</p>
      </div>

      <!-- Dashboard content -->
      <div v-else>
        <!-- Analytics Metrics Cards -->
        <section class="metrics-section">
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-icon">
                <i class="bi bi-cart-check"></i>
              </div>
              <div class="metric-content">
                <h3>Total Orders</h3>
                <p class="metric-value">{{ metrics.totalOrders }}</p>
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-icon">
                <i class="bi bi-currency-dollar"></i>
              </div>
              <div class="metric-content">
                <h3>Total Revenue</h3>
                <p class="metric-value">${{ formatCurrency(metrics.totalRevenue) }}</p>
              </div>
            </div>
            
            <div class="metric-card low-stock-card" @click="goToLowStock">
              <div class="metric-icon">
                <i class="bi bi-exclamation-triangle"></i>
              </div>
              <div class="metric-content">
                <h3>Low Stock Items</h3>
                <p class="metric-value">{{ metrics.lowStockItems }}</p>
                <span class="low-stock-alert">Click to manage</span>
              </div>
            </div>
          </div>
        </section>



        <!-- Charts Section -->
        <section class="charts-section">
          <div class="charts-grid">
            <!-- Sales Trend Chart -->
            <div class="chart-card">
              <div class="chart-header">
                <h3>Sales Trend</h3>
                <button class="download-btn" @click="exportChart('salesTrend')">
                  <i class="bi bi-download"></i>
                </button>
              </div>
              <div class="chart-container">
                <canvas ref="salesTrendChart"></canvas>


              </div>
            </div>

            <!-- Stock Levels Chart -->
            <div class="chart-card">
              <div class="chart-header">
                <h3>Stock Levels</h3>
                <button class="download-btn" @click="exportChart('stockLevels')">
                  <i class="bi bi-download"></i>
                </button>
              </div>
              <div class="chart-container">
                <canvas ref="stockLevelsChart"></canvas>


              </div>
            </div>
          </div>
        </section>



        <!-- Quick Actions -->
        <section class="quick-actions">
          <div class="section-header">
            <h2><i class="bi bi-lightning-charge me-2"></i>Quick Actions</h2>
          </div>
          
          <div class="action-buttons">
            <router-link to="/admin/products" class="action-button">
              <i class="bi bi-box-seam"></i>
              <span>Manage Products</span>
            </router-link>
            
            <router-link to="/admin/orders" class="action-button">
              <i class="bi bi-list-check"></i>
              <span>Manage Orders</span>
            </router-link>
            
            <router-link to="/admin/customers" class="action-button">
              <i class="bi bi-people"></i>
              <span>Manage Customers</span>
            </router-link>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import Sidebar from '@/components/Sidebar.vue';
import NotificationBell from '@/features/notifications/components/NotificationBell.vue';
import { useAuthStore } from '@/stores/auth';
import { useAnalytics } from '@/lib/analytics/useAnalytics';
// Import Chart.js properly
import Chart from 'chart.js/auto';

const router = useRouter();
const authStore = useAuthStore();
const user = computed(() => authStore.user || { username: 'Admin' });

// Analytics data
const { metrics, salesTrend, inventoryLevels, isLoading, loadError } = useAnalytics(30);

// Chart references
const salesTrendChart = ref(null);
const stockLevelsChart = ref(null);

// Chart instances for cleanup
let salesTrendChartInstance = null;
let stockLevelsChartInstance = null;



onMounted(async () => {
  console.log('🔄 AdminDashboardHome mounted');
  await nextTick();
  
  // Initialize charts after a short delay to ensure DOM is ready
  setTimeout(() => {
    console.log('📊 Initializing charts...');
    console.log('📈 Sales trend data:', salesTrend.value);
    console.log('📦 Inventory levels data:', inventoryLevels.value);
    console.log('⏳ Loading state:', isLoading.value);
    console.log('❌ Error state:', loadError.value);
    
    if (!isLoading.value && !loadError.value) {
      initializeCharts();
    }
  }, 1000);
});

// Watch for data changes and reinitialize charts
watch([salesTrend, inventoryLevels, isLoading, loadError], ([newSalesTrend, newInventoryLevels, newIsLoading, newLoadError]) => {
  console.log('👀 Data changed, checking if charts should be initialized...');
  console.log('📈 New sales trend:', newSalesTrend);
  console.log('📦 New inventory levels:', newInventoryLevels);
  console.log('⏳ New loading state:', newIsLoading);
  console.log('❌ New error state:', newLoadError);
  
  if (!newIsLoading && !newLoadError && newSalesTrend && newInventoryLevels && 
      newSalesTrend.labels && newSalesTrend.labels.length > 0 && 
      newInventoryLevels.inStock !== undefined) {
    console.log('✅ Data ready, initializing charts...');
    setTimeout(() => {
      initializeCharts();
    }, 500);
  }
}, { deep: true });

// Cleanup charts when component is unmounted
onUnmounted(() => {
  console.log('🧹 Cleaning up charts...');
  if (salesTrendChartInstance) {
    salesTrendChartInstance.destroy();
    salesTrendChartInstance = null;
  }
  if (stockLevelsChartInstance) {
    stockLevelsChartInstance.destroy();
    stockLevelsChartInstance = null;
  }
});

const initializeCharts = () => {
  console.log('🎯 initializeCharts called');
  console.log('📈 Sales trend ref:', salesTrendChart.value);
  console.log('📦 Stock levels ref:', stockLevelsChart.value);
  console.log('📊 Sales trend data:', salesTrend.value);
  console.log('📦 Inventory levels data:', inventoryLevels.value);
  
  // Check if refs are available
  if (!salesTrendChart.value || !stockLevelsChart.value) {
    console.log('❌ Chart refs not ready, waiting for DOM...');
    return;
  }
  
  if (salesTrend.value && salesTrend.value.labels && salesTrend.value.labels.length > 0) {
    console.log('✅ Creating sales trend chart with real data');
    createSalesTrendChart();
  } else {
    console.log('❌ Sales trend chart not ready:', { 
      salesTrend: salesTrend.value, 
      hasLabels: salesTrend.value?.labels?.length > 0
    });
  }
  
  if (inventoryLevels.value && inventoryLevels.value.inStock !== undefined) {
    console.log('✅ Creating stock levels chart with real data');
    createStockLevelsChart();
  } else {
    console.log('❌ Stock levels chart not ready:', { 
      inventoryLevels: inventoryLevels.value, 
      hasData: inventoryLevels.value?.inStock !== undefined
    });
  }
};

const createSalesTrendChart = () => {
  try {
    // Check if ref is available
    if (!salesTrendChart.value) {
      console.log('❌ Sales trend chart ref not available');
      return;
    }
    
    // Destroy existing chart if it exists
    if (salesTrendChartInstance) {
      salesTrendChartInstance.destroy();
      salesTrendChartInstance = null;
    }
    
    const ctx = salesTrendChart.value.getContext('2d');
    
    // Validate data
    if (!salesTrend.value || !salesTrend.value.labels || !salesTrend.value.orders || !salesTrend.value.revenue) {
      console.error('❌ Invalid sales trend data:', salesTrend.value);
      return;
    }
    
    console.log('📈 Creating sales trend chart with data:', {
      labels: salesTrend.value.labels,
      orders: salesTrend.value.orders,
      revenue: salesTrend.value.revenue,
      labelsLength: salesTrend.value.labels.length,
      ordersLength: salesTrend.value.orders.length,
      revenueLength: salesTrend.value.revenue.length
    });
    
    salesTrendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: salesTrend.value.labels,
        datasets: [
          {
            label: 'Orders',
            data: salesTrend.value.orders,
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Revenue',
            data: salesTrend.value.revenue,
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Orders'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Revenue ($)'
          },
          grid: {
            drawOnChartArea: false,
          },
        }
      }
    }
  });
  } catch (error) {
    console.error('❌ Error creating sales trend chart:', error);
  }
};

const createStockLevelsChart = () => {
  try {
    // Check if ref is available
    if (!stockLevelsChart.value) {
      console.log('❌ Stock levels chart ref not available');
      return;
    }
    
    // Destroy existing chart if it exists
    if (stockLevelsChartInstance) {
      stockLevelsChartInstance.destroy();
      stockLevelsChartInstance = null;
    }
    
    const ctx = stockLevelsChart.value.getContext('2d');
    const data = inventoryLevels.value;
    
    // Validate data
    if (!data || typeof data.inStock === 'undefined' || typeof data.lowStock === 'undefined' || 
        typeof data.outOfStock === 'undefined' || typeof data.discontinued === 'undefined') {
      console.error('❌ Invalid inventory levels data:', data);
      return;
    }
    
    console.log('📦 Creating stock levels chart with data:', {
      inStock: data.inStock,
      lowStock: data.lowStock,
      outOfStock: data.outOfStock,
      discontinued: data.discontinued,
      total: data.inStock + data.lowStock + data.outOfStock + data.discontinued
    });
    
    stockLevelsChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'],
        datasets: [{
          data: [data.inStock, data.lowStock, data.outOfStock, data.discontinued],
          backgroundColor: [
            '#2ecc71',
            '#f39c12',
            '#e74c3c',
            '#95a5a6'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Error creating stock levels chart:', error);
  }
};

// Helper functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
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

function getStatusBadgeClass(status) {
  const statusMap = {
    'PENDING': 'badge-pending',
    'CONFIRMED': 'badge-confirmed',
    'SHIPPED': 'badge-shipped',
    'DELIVERED': 'badge-delivered',
    'CANCELLED': 'badge-cancelled'
  };
  return statusMap[status] || 'badge-secondary';
}

function exportChart(chartType) {
  // Placeholder for chart export functionality
  console.log(`Exporting ${chartType} chart`);
}

function goToLowStock() {
  router.push('/admin/low-stock');
}
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
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.dashboard-header h1 {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--text-dark, #2c3e50);
  margin: 0;
}

.user-welcome {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.user-welcome span {
  color: var(--text-muted, #6c757d);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-light, #a9dfbf);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.5rem;
}

.user-avatar i {
  color: var(--primary-color, #2ecc71);
  font-size: 1.2rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-dark, #2c3e50);
}

/* Metrics Section */
.metrics-section {
  margin-bottom: 2.5rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.metric-card {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-left: 4px solid var(--primary-color, #2ecc71);
}

.metric-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.5rem;
  background-color: rgba(46, 204, 113, 0.1);
  color: var(--primary-color, #2ecc71);
}

.metric-content {
  flex: 1;
}

.metric-content h3 {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-muted, #6c757d);
  margin: 0 0 0.5rem 0;
}

.metric-value {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: var(--text-dark, #2c3e50);
}

.metric-change {
  font-size: 0.875rem;
  font-weight: 500;
}

.metric-change.positive {
  color: #2ecc71;
}

.metric-change.negative {
  color: #e74c3c;
}

.low-stock-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-left-color: #e74c3c !important;
}

.low-stock-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(231, 76, 60, 0.2);
}

.low-stock-card .metric-icon {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.low-stock-alert {
  font-size: 0.875rem;
  color: #e74c3c;
  font-weight: 500;
  margin-top: 0.25rem;
  display: block;
}

/* Charts Section */
.charts-section {
  margin-bottom: 2.5rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.chart-card {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-dark, #2c3e50);
}

.download-btn {
  background: none;
  border: none;
  color: var(--text-muted, #6c757d);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: color 0.3s ease;
}

.download-btn:hover {
  color: var(--primary-color, #2ecc71);
}

.chart-container {
  height: 300px;
  position: relative;
  min-height: 300px;
}

.chart-container canvas {
  width: 100% !important;
  height: 100% !important;
}

.chart-fallback {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--text-muted, #6c757d);
}

.chart-fallback i {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.chart-fallback p {
  margin: 0;
  font-size: 0.9rem;
}

.chart-data-fallback {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--text-dark, #2c3e50);
  background: rgba(255, 255, 255, 0.9);
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.chart-data-fallback h4 {
  margin: 0 0 0.5rem 0;
  color: var(--primary-color, #2ecc71);
}

.chart-data-fallback p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

/* Recent Activities */
.recent-activities {
  margin-bottom: 2.5rem;
}

.order-id {
  font-weight: 600;
  color: var(--primary-color, #2ecc71);
}

/* Quick Actions */
.action-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: white;
  border-radius: 12px;
  text-decoration: none;
  color: var(--text-dark, #2c3e50);
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.action-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.action-button i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--primary-color, #2ecc71);
  transition: transform 0.3s ease;
}

.action-button:hover i {
  transform: scale(1.2);
}

.action-button span {
  font-weight: 500;
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 992px) {
  .action-buttons {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  
  .user-welcome {
    width: 100%;
    justify-content: space-between;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
