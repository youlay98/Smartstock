<template>
  <div class="cart-drawer-overlay" v-if="isOpen" @click="closeCart">
    <div class="cart-drawer" @click.stop>
      <!-- Enhanced Header -->
      <div class="cart-header">
        <div class="cart-title-wrapper">
          <h3 class="cart-title">
            <i class="bi bi-cart3"></i>
            {{ $t('cart.cart.title') }}
          </h3>
          <span v-if="!isEmpty" class="cart-subtitle">{{ totalItems }} item{{ totalItems !== 1 ? 's' : '' }} in your cart</span>
        </div>
        <button class="btn-close" @click="closeCart" :aria-label="$t('cart.cart.closeCart')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="cart-loading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p>{{ $t('cart.cart.loading') }}</p>
      </div>

      <!-- Enhanced Empty Cart -->
      <div v-else-if="isEmpty" class="cart-empty">
        <div class="empty-cart-icon">
          <i class="bi bi-cart-x"></i>
        </div>
        <h3 class="empty-cart-title">{{ $t('cart.cart.emptyCart') }}</h3>
        <p class="empty-cart-description">Your shopping cart is waiting for some amazing products! Start exploring our collection to find what you need.</p>
        <div class="empty-cart-actions">
          <AppButton
            variant="primary"
            @click="continueShopping"
            class="continue-shopping-btn"
          >
            <i class="bi bi-bag-plus"></i>
            {{ $t('cart.cart.continueShopping') }}
          </AppButton>
          <div class="empty-cart-suggestions">
            <p class="suggestions-text">Popular categories:</p>
            <div class="suggestion-tags">
              <span class="suggestion-tag">Electronics</span>
              <span class="suggestion-tag">Office Supplies</span>
              <span class="suggestion-tag">Home & Garden</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Cart Items -->
      <div v-else class="cart-content">
        <div class="cart-items">
          <div
            v-for="item in items"
            :key="item.id"
            class="cart-item"
          >
            <!-- Enhanced Item Image -->
            <div class="item-image">
              <img
                :src="getItemImage(item)"
                :alt="item.name"
                @error="handleImageError"
                class="item-img"
              />
            </div>

            <!-- Enhanced Item Details -->
            <div class="item-details">
              <h5 class="item-name">{{ item.productName || $t('cart.cart.productNameNotAvailable') }}</h5>
              <div class="item-price">€{{ formatPrice(item.unitPrice) }}</div>
              
              <!-- Enhanced Quantity Controls -->
              <div class="quantity-controls">
                <button
                  class="quantity-btn"
                  @click="updateQuantity(item.id, item.quantity - 1)"
                  :disabled="item.quantity <= 1 || isUpdating"
                >
                  <i class="bi bi-dash"></i>
                </button>
                <span class="quantity-display">{{ item.quantity }}</span>
                <button
                  class="quantity-btn"
                  @click="updateQuantity(item.id, item.quantity + 1)"
                  :disabled="item.quantity >= (item.stockQuantity || 999) || isUpdating"
                >
                  <i class="bi bi-plus"></i>
                </button>
              </div>

              <!-- Enhanced Stock Warning -->
              <div v-if="item.quantity >= (item.stockQuantity || 999)" class="stock-warning">
                <i class="bi bi-exclamation-triangle"></i>
                <span>{{ $t('cart.cart.maximumQuantity') }}</span>
              </div>
            </div>

            <!-- Enhanced Item Actions -->
            <div class="item-actions">
              <div class="item-subtotal">
                <span class="subtotal-label">Subtotal</span>
                <span class="subtotal-amount">€{{ formatPrice(item.totalPrice) }}</span>
              </div>
              <button
                class="remove-item-btn"
                @click="removeItem(item.id)"
                :disabled="isUpdating"
                :title="$t('cart.cart.removeItem')"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Enhanced Cart Summary -->
        <div class="cart-summary">
          <div class="summary-header">
            <h4 class="summary-title">Order Summary</h4>
          </div>
          
          <div class="summary-details">
            <div class="summary-row">
              <span class="summary-label">{{ $t('cart.cart.subtotal') }}</span>
              <span class="summary-value">€{{ formatPrice(subtotal) }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">{{ $t('cart.cart.products') }}</span>
              <span class="summary-value">{{ totalItems }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">{{ $t('cart.cart.totalItems') }}</span>
              <span class="summary-value">{{ totalQuantities }}</span>
            </div>
          </div>
          
          <div class="summary-divider"></div>
          
          <div class="summary-total">
            <span class="total-label">{{ $t('cart.cart.total') }}</span>
            <span class="total-amount">€{{ formatPrice(subtotal) }}</span>
          </div>
        </div>

        <!-- Enhanced Cart Actions -->
        <div class="cart-actions">
          <AppButton
            variant="outline-secondary"
            @click="clearCart"
            :loading="isClearing"
            class="clear-cart-btn"
          >
            <i class="bi bi-trash"></i>
            {{ $t('cart.cart.clearCart') }}
          </AppButton>
          
          <AppButton
            variant="primary"
            @click="proceedToCheckout"
            :disabled="isEmpty"
            class="checkout-btn"
          >
            <i class="bi bi-credit-card"></i>
            {{ $t('cart.cart.proceedToCheckout') }}
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '@/stores/cart'
import AppButton from '@/ui/atoms/AppButton.vue'
import { showSuccessToast, showWarningToast } from '@/services/api'

const { t } = useI18n()

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const router = useRouter()
const cartStore = useCartStore()

// Computed
const items = computed(() => cartStore.items)
const subtotal = computed(() => cartStore.subtotal)
const totalItems = computed(() => cartStore.totalItems)
const totalQuantities = computed(() => cartStore.totalQuantities)
const isEmpty = computed(() => cartStore.isEmpty)
const isLoading = computed(() => cartStore.isLoading)

// Local state for specific actions
const isUpdating = ref(false)
const isClearing = ref(false)

// Methods
const closeCart = () => {
  emit('close')
}

const getItemImage = (item) => {
  return item.imageUrl || '/placeholder-product.jpg'
}

const handleImageError = (event) => {
  event.target.src = '/placeholder-product.jpg'
}

const formatPrice = (price) => {
  // Handle null, undefined, or invalid price values
  if (price === null || price === undefined || isNaN(price) || price === '') {
    return '0.00'
  }
  
  // Convert to number and format
  const numericPrice = Number(price)
  if (isNaN(numericPrice)) {
    return '0.00'
  }
  
  return numericPrice.toFixed(2)
}

const updateQuantity = async (itemId, newQuantity) => {
  if (newQuantity <= 0) {
    await removeItem(itemId)
    return
  }

  try {
    isUpdating.value = true
    await cartStore.updateItemQuantity(itemId, newQuantity)
  } catch (error) {
    console.error('Error updating quantity:', error)
    
    // Check if it's a network error (services offline)
    if (!error.response) {
      showWarningToast('Unable to connect to server. Please check if services are running.')
    } else if (error.response?.status === 403) {
      showWarningToast(t('cart.cart.noPermissionUpdate'))
    } else if (error.response?.status === 401) {
      showWarningToast('Your session has expired. Please log in again.')
    } else {
      showWarningToast('Failed to update quantity. Please try again.')
    }
  } finally {
    isUpdating.value = false
  }
}

const removeItem = async (itemId) => {
  try {
    await cartStore.removeItem(itemId)
          showSuccessToast(t('cart.cart.itemRemoved'))
  } catch (error) {
    console.error('Error removing item:', error)
    
    // Check if it's a network error (services offline)
    if (!error.response) {
      showWarningToast('Unable to connect to server. Please check if services are running.')
    } else if (error.response?.status === 403) {
      showWarningToast(t('cart.cart.noPermissionRemove'))
    } else if (error.response?.status === 401) {
      showWarningToast('Your session has expired. Please log in again.')
    } else {
      showWarningToast('Failed to remove item. Please try again.')
    }
  }
}

const clearCart = async () => {
  if (!confirm('Are you sure you want to clear your cart?')) return

  try {
    isClearing.value = true
    await cartStore.clearCart()
    showSuccessToast('Cart cleared')
  } catch (error) {
    console.error('Error clearing cart:', error)
    showWarningToast('Failed to clear cart')
  } finally {
    isClearing.value = false
  }
}

const proceedToCheckout = () => {
  closeCart()
  router.push('/checkout')
}

const continueShopping = () => {
  closeCart()
  // Navigate to dashboard with Place Order tab active
  router.push('/dashboard?tab=placeOrder')
}
</script>

<style scoped>
.cart-drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: var(--z-modal);
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.3s ease;
  backdrop-filter: blur(4px);
}

.cart-drawer {
  width: 100%;
  max-width: 450px;
  height: 100vh;
  background: var(--color-white);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
  box-shadow: var(--shadow-2xl);
}

/* Enhanced Header */
.cart-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  padding: var(--spacing-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
  z-index: 10;
}

.cart-title-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.cart-title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.cart-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-white);
  opacity: 0.9;
  margin-top: var(--spacing-xs);
}

.btn-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: var(--font-size-lg);
  color: var(--color-white);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

/* Enhanced Loading State */
.cart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  text-align: center;
  color: var(--color-text-secondary);
}

.cart-loading .spinner-border {
  margin-bottom: var(--spacing-lg);
}

/* Enhanced Empty State */
.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  text-align: center;
  color: var(--color-text-secondary);
  flex: 1;
}

.empty-cart-icon {
  width: 120px;
  height: 120px;
  background: var(--color-gray-100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-xl);
}

.empty-cart-icon i {
  font-size: 3rem;
  color: var(--color-gray-400);
}

.empty-cart-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.empty-cart-description {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-xl) 0;
  max-width: 300px;
  line-height: var(--line-height-relaxed);
}

.empty-cart-actions {
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.continue-shopping-btn {
  width: 100%;
  padding: var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.empty-cart-suggestions {
  text-align: center;
}

.suggestions-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-md) 0;
  font-weight: var(--font-weight-medium);
}

.suggestion-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  justify-content: center;
}

.suggestion-tag {
  background: var(--color-primary-100);
  color: var(--color-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-normal);
  border: 1px solid var(--color-primary-200);
}

.suggestion-tag:hover {
  background: var(--color-primary);
  color: var(--color-white);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* Enhanced Cart Content */
.cart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

/* Enhanced Cart Items */
.cart-item {
  display: grid;
  grid-template-columns: 80px 1fr auto auto;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-lg);
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  margin-bottom: var(--spacing-md);
  transition: all var(--transition-normal);
  position: relative;
}

.cart-item:hover {
  box-shadow: var(--shadow-md);
  border-top: 3px solid var(--color-primary);
}

.cart-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.cart-item:hover::before {
  opacity: 1;
}

/* Enhanced Item Image */
.item-image {
  flex-shrink: 0;
  width: 90px;
  height: 90px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-gray-50);
  border: 2px solid var(--color-border-light);
  position: relative;
}

.item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}

.cart-item:hover .item-img {
  transform: scale(1.05);
}

/* Enhanced Item Details */
.item-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-width: 0;
  flex: 1;
}

.item-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  line-height: 1.3;
  margin-bottom: var(--spacing-xs);
  word-wrap: break-word;
}

.item-price {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}

/* Enhanced Quantity Controls */
.quantity-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  background: var(--color-gray-50);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xs);
  width: fit-content;
}

.quantity-btn {
  width: 32px;
  height: 32px;
  border: 2px solid var(--color-border-light);
  background: var(--color-white);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-normal);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
}

.quantity-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-white);
  transform: scale(1.1);
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-display {
  min-width: 40px;
  text-align: center;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  background: var(--color-white);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

/* Enhanced Stock Warning */
.stock-warning {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-warning);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  margin-top: var(--spacing-xs);
  background: var(--color-warning-50);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-warning-200);
}

.stock-warning i {
  font-size: var(--font-size-sm);
}

/* Enhanced Item Actions */
.item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-md);
  justify-content: space-between;
  min-width: 120px;
}

.item-subtotal {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-xs);
  text-align: right;
}

.subtotal-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: var(--font-weight-medium);
}

.subtotal-amount {
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  font-size: var(--font-size-lg);
}

.remove-item-btn {
  width: 36px;
  height: 36px;
  border: 2px solid var(--color-danger);
  background: var(--color-white);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-normal);
  color: var(--color-danger);
}

.remove-item-btn:hover:not(:disabled) {
  background: var(--color-danger);
  color: var(--color-white);
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.remove-item-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Enhanced Cart Summary */
.cart-summary {
  padding: var(--spacing-xl);
  border-top: 1px solid var(--color-border-light);
  background: var(--color-gray-50);
}

.summary-header {
  margin-bottom: var(--spacing-lg);
}

.summary-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.summary-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
}

.summary-label {
  color: var(--color-text-secondary);
}

.summary-value {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.summary-divider {
  height: 1px;
  background: var(--color-border-light);
  margin: var(--spacing-lg) 0;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-md);
  border-top: 2px solid var(--color-border-light);
}

.total-label {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.total-amount {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

/* Enhanced Cart Actions */
.cart-actions {
  padding: var(--spacing-xl);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  background: var(--color-white);
}

.clear-cart-btn {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.checkout-btn {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg) var(--spacing-xl);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  width: 100%;
  box-shadow: var(--shadow-md);
}

.checkout-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.checkout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Responsive Design */
@media (max-width: 480px) {
  .cart-drawer {
    max-width: 100%;
  }
  
  .cart-header {
    padding: var(--spacing-lg);
  }
  
  .cart-items {
    padding: var(--spacing-md);
  }
  
  .cart-item {
    padding: var(--spacing-md);
    gap: var(--spacing-md);
  }
  
  .item-image {
    width: 70px;
    height: 70px;
  }
  
  .cart-summary {
    padding: var(--spacing-lg);
  }
  
  .cart-actions {
    padding: var(--spacing-lg);
  }
}
</style> 