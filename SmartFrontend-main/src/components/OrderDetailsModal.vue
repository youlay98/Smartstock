<template>
  <div class="modal fade" ref="orderModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Order Details - Order #{{ order.id }}</h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>
        <div class="modal-body">
          <p><strong>Date:</strong> {{ formatDate(order.orderDate) }}</p>
          <p><strong>Status:</strong> {{ order.status }}</p>
          <p><strong>Total Amount:</strong> €{{ order.totalAmount }}</p>
          <hr />
          <h6>Items</h6>
          <table class="table table-bordered">
            <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price (€)</th>
              <th>Subtotal (€)</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="item in order.orderItems" :key="item.id">
              <td>{{ getProductName(item.productId) }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.unitPrice }}</td>
              <td>{{ (item.unitPrice * item.quantity).toFixed(2) }}</td>
            </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {defineProps, defineEmits, ref, onMounted, watch, nextTick} from 'vue';
import {Modal} from 'bootstrap';
import {getAllProducts} from '@/services/productservice';

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['close']);

const orderModal = ref(null);
let modalInstance = null;

const productMap = ref({});

onMounted(async () => {
  modalInstance = new Modal(orderModal.value, {backdrop: 'static'});
  const response = await getAllProducts();
  response.data.forEach((product) => {
    productMap.value[product.id] = product.name;
  });
  modalInstance.show();
});

// Watch for prop change and re-open modal
watch(() => props.order, async () => {
  await nextTick();
  modalInstance.show();
});

function getProductName(productId) {
  return productMap.value[productId] || `Product #${productId}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

function closeModal() {
  modalInstance.hide();
  emit('close');
}
</script>
