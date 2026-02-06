<template>
  <div class="profile-tab">
    <!-- Show loading state when profile is not available -->
    <div v-if="!profile" class="loading-state">
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <p class="loading-text">Loading profile...</p>
    </div>
    
    <!-- Show warning when profile exists but has no ID -->
    <div v-else-if="!profile.id" class="warning-state">
      <div class="warning-icon">
        <i class="bi bi-exclamation-triangle-fill"></i>
      </div>
      <p class="warning-text">{{ $t('common.common.noProfileData') }}</p>
    </div>
    
    <!-- Show profile content when profile is available -->
    <div v-else class="profile-container">
      <!-- Enhanced Profile Header -->
      <div class="profile-header">
        <div class="profile-avatar">
          <div class="avatar-circle">
            <i class="bi bi-person-circle"></i>
          </div>
          <div class="online-indicator"></div>
        </div>
        <div class="profile-title">
          <h2>{{ profile.name || $t('common.common.customer') }}</h2>
          <p class="profile-email">
            <i class="bi bi-envelope"></i>
            {{ profile.email || $t('common.common.noEmailProvided') }}
          </p>
          <div class="profile-meta">
            <span class="member-since">
              <i class="bi bi-calendar-check"></i>
              Member since {{ formatDate(creationDate) }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="profile-body">
        <!-- Personal Information Card -->
        <div class="info-card">
          <div class="card-header">
            <div class="header-content">
              <div class="header-icon">
                <i class="bi bi-person-badge"></i>
              </div>
              <h3>{{ $t('common.common.personalInformation') }}</h3>
            </div>
            <button class="edit-button" @click="editMode = !editMode">
              <i class="bi" :class="editMode ? 'bi-x-circle' : 'bi-pencil'"></i>
              {{ editMode ? $t('common.common.cancel') : $t('common.common.edit') }}
            </button>
          </div>
          
          <div class="card-body">
            <form v-if="editMode" @submit.prevent="saveProfile" class="edit-form">
              <div class="form-grid">
                <div class="form-group">
                  <label for="name" class="form-label">
                    <i class="bi bi-person"></i>
                    {{ $t('common.common.fullName') }}
                  </label>
                  <input 
                    type="text" 
                    class="form-input" 
                    id="name" 
                    v-model="formData.name" 
                    required
                    placeholder="Enter your full name"
                  >
                </div>
                
                <div class="form-group">
                  <label for="email" class="form-label">
                    <i class="bi bi-envelope"></i>
                    {{ $t('common.common.emailAddress') }}
                  </label>
                  <input 
                    type="email" 
                    class="form-input" 
                    id="email" 
                    v-model="formData.email" 
                    required
                    placeholder="Enter your email address"
                  >
                </div>
                
                <div class="form-group">
                  <label for="phone" class="form-label">
                    <i class="bi bi-telephone"></i>
                    {{ $t('common.common.phoneNumber') }}
                  </label>
                  <input 
                    type="tel" 
                    class="form-input" 
                    id="phone" 
                    v-model="formData.phone"
                    placeholder="Enter your phone number"
                  >
                </div>
                
                <div class="form-group full-width">
                  <label for="address" class="form-label">
                    <i class="bi bi-geo-alt"></i>
                    {{ $t('common.common.address') }}
                  </label>
                  <textarea 
                    class="form-textarea" 
                    id="address" 
                    v-model="formData.address" 
                    rows="3"
                    placeholder="Enter your address"
                  ></textarea>
                </div>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn-secondary" @click="editMode = false">
                  <i class="bi bi-x"></i>
                  {{ $t('common.common.cancel') }}
                </button>
                <button type="submit" class="btn-primary" :disabled="isSaving">
                  <div v-if="isSaving" class="btn-spinner"></div>
                  <i v-else class="bi bi-check"></i>
                  {{ $t('common.common.saveChanges') }}
                </button>
              </div>
            </form>
            
            <div v-else class="profile-info">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-icon">
                    <i class="bi bi-person"></i>
                  </div>
                  <div class="info-content">
                    <div class="info-label">{{ $t('common.common.fullName') }}</div>
                    <div class="info-value">{{ profile.name || $t('common.common.notProvided') }}</div>
                  </div>
                </div>
                
                <div class="info-item">
                  <div class="info-icon">
                    <i class="bi bi-envelope"></i>
                  </div>
                  <div class="info-content">
                    <div class="info-label">{{ $t('common.common.emailAddress') }}</div>
                    <div class="info-value">{{ profile.email || $t('common.common.notProvided') }}</div>
                  </div>
                </div>
                
                <div class="info-item">
                  <div class="info-icon">
                    <i class="bi bi-telephone"></i>
                  </div>
                  <div class="info-content">
                    <div class="info-label">{{ $t('common.common.phoneNumber') }}</div>
                    <div class="info-value">{{ profile.phone || $t('common.common.notProvided') }}</div>
                  </div>
                </div>
                
                <div class="info-item">
                  <div class="info-icon">
                    <i class="bi bi-geo-alt"></i>
                  </div>
                  <div class="info-content">
                    <div class="info-label">{{ $t('common.common.address') }}</div>
                    <div class="info-value">{{ profile.address || $t('common.common.notProvided') }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Enhanced Account Summary Card -->
        <div class="summary-card">
          <div class="card-header">
            <div class="header-content">
              <div class="header-icon">
                <i class="bi bi-graph-up"></i>
              </div>
              <h3>{{ $t('common.common.accountSummary') }}</h3>
            </div>
          </div>
          
          <div class="card-body">
            <div class="summary-stats">
              <div class="stat-card orders-stat">
                <div class="stat-icon">
                  <i class="bi bi-box-seam"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ orderCount }}</div>
                  <div class="stat-label">{{ $t('dashboard.stats.totalOrders') }}</div>
                  <div class="stat-trend">
                    <i class="bi bi-arrow-up"></i>
                    <span>+12% this month</span>
                  </div>
                </div>
              </div>
              
              <div class="stat-card pending-stat">
                <div class="stat-icon">
                  <i class="bi bi-clock-history"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ pendingOrderCount }}</div>
                  <div class="stat-label">{{ $t('common.common.pendingOrders') }}</div>
                  <div class="stat-trend">
                    <i class="bi bi-arrow-down"></i>
                    <span>-5% this week</span>
                  </div>
                </div>
              </div>
              
              <div class="stat-card completed-stat">
                <div class="stat-icon">
                  <i class="bi bi-check-circle"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ completedOrderCount }}</div>
                  <div class="stat-label">{{ $t('common.common.completedOrders') }}</div>
                  <div class="stat-trend">
                    <i class="bi bi-arrow-up"></i>
                    <span>+8% this month</span>
                  </div>
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
import { ref, computed, onMounted, watch } from 'vue';
import { getOrdersByCustomer } from '@/services/orderService';
import { updateCustomer } from '@/services/customerService';

const props = defineProps({
  profile: {
    type: Object,
    required: false,
    default: () => ({})
  }
});

const emit = defineEmits(['update-profile']);

const editMode = ref(false);
const isSaving = ref(false);
const formData = ref({
  name: '',
  email: '',
  phone: '',
  address: ''
});
const orders = ref([]);

onMounted(async () => {
  resetForm();
  if (props.profile && props.profile.id) {
    try {
      const response = await getOrdersByCustomer(props.profile.id);
      orders.value = response.data;
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  }
});

function resetForm() {
  formData.value = {
    name: props.profile?.name || '',
    email: props.profile?.email || '',
    phone: props.profile?.phone || '',
    address: props.profile?.address || ''
  };
}

// Initialize form data when profile changes
watch(() => props.profile, (newProfile) => {
  if (newProfile) {
    console.log('Profile data received:', newProfile); // Debug log
    formData.value = {
      name: newProfile?.name || '',
      email: newProfile?.email || '',
      phone: newProfile?.phone || '',
      address: newProfile?.address || ''
    };
  }
}, { immediate: true });

async function saveProfile() {
  if (!props.profile || !props.profile.id) {
    console.error('No profile ID found');
    return;
  }
  
  try {
    isSaving.value = true;
    
    const updatedProfile = {
      ...props.profile,
      name: formData.value.name,
      email: formData.value.email,
      phone: formData.value.phone,
      address: formData.value.address
    };
    
    await updateCustomer(props.profile.id, updatedProfile);
    emit('update-profile', updatedProfile);
    editMode.value = false;
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Failed to update profile. Please try again.');
  } finally {
    isSaving.value = false;
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
}

const orderCount = computed(() => orders.value.length);
const pendingOrderCount = computed(() => 
  orders.value.filter(order => order.status === 'PENDING').length
);
const completedOrderCount = computed(() => 
  orders.value.filter(order => ['DELIVERED', 'COMPLETED'].includes(order.status)).length
);

// Get creation date from multiple possible field names
const creationDate = computed(() => {
  if (!props.profile) return null;
  
  // Try different possible field names
  return props.profile.createdDate || 
         props.profile.createdAt || 
         props.profile.created_at || 
         props.profile.creationDate ||
         props.profile.dateCreated ||
         null;
});
</script>

<style scoped>
.profile-tab {
  max-width: 900px;
  margin: 0 auto;
}

/* Loading and Warning States */
.loading-state,
.warning-state {
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
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-gray-200);
  border-top: 3px solid var(--color-primary);
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

.warning-icon {
  font-size: 3rem;
  color: var(--color-warning);
  margin-bottom: var(--spacing-lg);
}

.warning-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  margin: 0;
}

/* Profile Container */
.profile-container {
  background-color: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

/* Enhanced Profile Header */
.profile-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  padding: var(--spacing-2xl);
  border-radius: var(--radius-2xl);
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  position: relative;
  overflow: hidden;
}

.profile-avatar {
  position: relative;
}

.avatar-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid rgba(255, 255, 255, 0.3);
}

.avatar-circle i {
  font-size: 3rem;
  color: var(--color-white);
}

.online-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: var(--color-success);
  border: 3px solid var(--color-white);
  border-radius: 50%;
}

.profile-title h2 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
}

.profile-email {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-lg);
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.member-since {
  font-size: var(--font-size-sm);
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* Profile Body */
.profile-body {
  padding: var(--spacing-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

/* Info Card */
.info-card,
.summary-card {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  border: 1px solid var(--color-border-light);
}

.card-header {
  background: var(--color-gray-50);
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.header-icon {
  width: 40px;
  height: 40px;
  background: var(--color-primary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
}

.header-icon i {
  font-size: var(--font-size-lg);
}

.card-header h3 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.edit-button {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
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

.edit-button:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.card-body {
  padding: var(--spacing-xl);
}

/* Form Styles */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.form-label i {
  color: var(--color-primary);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  transition: all var(--transition-normal);
  background: var(--color-white);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
}

.btn-secondary,
.btn-primary {
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: all var(--transition-normal);
  border: none;
  font-size: var(--font-size-base);
}

.btn-secondary {
  background: var(--color-gray-100);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background: var(--color-gray-200);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Profile Info Display */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-gray-50);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
}

.info-item:hover {
  background: var(--color-gray-100);
  transform: translateY(-2px);
}

.info-icon {
  width: 40px;
  height: 40px;
  background: var(--color-primary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
  font-weight: var(--font-weight-medium);
}

.info-value {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

/* Summary Stats */
.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.stat-card {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  text-align: center;
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.1;
  z-index: 0;
}

.stat-card.orders-stat {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--color-white);
}

.stat-card.pending-stat {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: var(--color-white);
}

.stat-card.completed-stat {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: var(--color-white);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.stat-icon i {
  font-size: var(--font-size-2xl);
}

.stat-content {
  z-index: 1;
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: var(--font-size-sm);
  opacity: 0.9;
  margin-bottom: var(--spacing-sm);
}

.stat-trend {
  font-size: var(--font-size-xs);
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* Responsive Design */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-lg);
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
  
  .profile-body {
    padding: var(--spacing-lg);
  }
  
  .card-body {
    padding: var(--spacing-lg);
  }
}
</style>
