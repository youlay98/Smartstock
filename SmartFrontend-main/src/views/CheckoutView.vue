<template>
  <div class="checkout-container">
    <div class="checkout-content">
      <h1>Checkout</h1>
      <div class="checkout-form">
        <div class="form-section">
          <h2>Shipping Information</h2>
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input type="text" id="fullName" v-model="shippingInfo.fullName" required>
          </div>
          <div class="form-group">
            <label for="address">Address</label>
            <input type="text" id="address" v-model="shippingInfo.address" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="city">City</label>
              <input type="text" id="city" v-model="shippingInfo.city" required>
            </div>
            <div class="form-group">
              <label for="postalCode">Postal Code</label>
              <input type="text" id="postalCode" v-model="shippingInfo.postalCode" required>
            </div>
          </div>
        </div>

        <div class="order-summary">
          <div class="summary-total">
            <strong>Total: €{{ totalAmount }}</strong>
          </div>
        </div>

        <button class="checkout-btn" @click="processCheckout" :disabled="isProcessing">
          {{ isProcessing ? 'Processing...' : 'Complete Order' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { placeOrder } from '@/services/orderService'
import { showSuccessToast, showWarningToast } from '@/services/api'

export default {
  name: 'CheckoutView',
  setup() {
    const router = useRouter()
    const cartStore = useCartStore()
    const authStore = useAuthStore()
    const isProcessing = ref(false)

    const shippingInfo = ref({
      fullName: '',
      address: '',
      city: '',
      postalCode: ''
    })

    const totalAmount = computed(() => cartStore.subtotal)

    const processCheckout = async () => {
      // Validate shipping information
      if (!shippingInfo.value.fullName || !shippingInfo.value.address || 
          !shippingInfo.value.city || !shippingInfo.value.postalCode) {
        showWarningToast('Please fill in all shipping information')
        return
      }

      if (cartStore.isEmpty) {
        showWarningToast('Your cart is empty')
        return
      }

      isProcessing.value = true
      
      try {
        console.log('Processing checkout...')
        
        // Create order with shipping information
        const orderData = {
          orderItems: cartStore.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          totalAmount: totalAmount.value,
          status: 'NEW',
          orderDate: new Date().toISOString()
        }

        console.log('Creating order:', orderData)
        await placeOrder(orderData)
        
        // Clear cart after successful order
        await cartStore.clearCart()
        
        showSuccessToast('Order placed successfully!')
        
        // Redirect to order history
        router.push('/dashboard?tab=orderHistory')
        
      } catch (error) {
        console.error('Error processing checkout:', error)
        showWarningToast('Failed to process order. Please try again.')
      } finally {
        isProcessing.value = false
      }
    }

    return {
      shippingInfo,
      totalAmount,
      isProcessing,
      processCheckout
    }
  }
}
</script>

<style scoped>
.checkout-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.checkout-content h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.checkout-form {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h2 {
  color: #555;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.order-summary {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 4px;
  margin-bottom: 2rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #ddd;
  font-size: 1.1rem;
}

.checkout-btn {
  width: 100%;
  padding: 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.checkout-btn:hover:not(:disabled) {
  background: #0056b3;
}

.checkout-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .checkout-container {
    padding: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style> 