<template>
  <!-- Bootstrap Modal for Editing Customer -->
  <div class="modal fade" id="editCustomerModal" tabindex="-1" aria-labelledby="editCustomerModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <form @submit.prevent="submitEdit">
          <div class="modal-header">
            <h5 class="modal-title" id="editCustomerModalLabel">Edit Customer</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="editName" class="form-label">Name</label>
              <input type="text" id="editName" class="form-control" v-model="editData.name" required>
            </div>
            <div class="mb-3">
              <label for="editEmail" class="form-label">Email</label>
              <input type="email" id="editEmail" class="form-control" v-model="editData.email" required>
            </div>
            <div class="mb-3">
              <label for="editPhone" class="form-label">Phone</label>
              <input type="text" id="editPhone" class="form-control" v-model="editData.phone">
            </div>
            <div class="mb-3">
              <label for="editAddress" class="form-label">Address</label>
              <input type="text" id="editAddress" class="form-control" v-model="editData.address">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, onMounted } from 'vue';
import { updateCustomer } from '@/services/customerService';

const props = defineProps({
  customer: Object
});
const emit = defineEmits(['updated']);

// The data we edit in the form
const editData = ref({
  id: null,
  name: '',
  email: '',
  phone: '',
  address: ''
});

// Watch for changes in the customer prop
watch(
    () => props.customer,
    (newCustomer) => {
      if (newCustomer) {
        editData.value = { ...newCustomer };
      }
    },
    { immediate: true }
);

// Submit the edit form
const submitEdit = async () => {
  try {
    await updateCustomer(editData.value.id, editData.value);
    emit('updated', editData.value);
    // Hide the modal using Bootstrap's modal API
    const modalEl = document.getElementById('editCustomerModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) {
      modalInstance.hide();
    }
  } catch (error) {
    console.error('Error updating customer:', error);
  }
};

onMounted(() => {
  const modalEl = document.getElementById('editCustomerModal');
  if (!bootstrap.Modal.getInstance(modalEl)) {
    new bootstrap.Modal(modalEl);
  }
});
</script>

<style scoped>
/* You can adjust modal styling as needed */
</style>
