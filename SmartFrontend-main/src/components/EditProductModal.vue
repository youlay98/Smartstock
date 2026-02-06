<template>
  <!-- Bootstrap Modal -->
  <div class="modal fade" id="editProductModal" tabindex="-1" aria-labelledby="editProductModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <form @submit.prevent="submitEdit">
          <div class="modal-header">
            <h5 class="modal-title" id="editProductModalLabel">Edit Product</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="editName" class="form-label">Product Name</label>
              <input 
                type="text" 
                id="editName" 
                class="form-control" 
                v-model="editData.name" 
                required
                @input="validateForm"
              >
            </div>
            <div class="mb-3">
              <label for="editPrice" class="form-label">Price (€)</label>
              <input 
                type="number" 
                id="editPrice" 
                class="form-control" 
                v-model.number="editData.price" 
                step="0.01" 
                required
                min="0.01"
                @input="validateForm"
              >
            </div>
            <div class="mb-3">
              <label for="editStock" class="form-label">Stock Quantity</label>
              <input 
                type="number" 
                id="editStock" 
                class="form-control" 
                v-model.number="editData.stock_quantity" 
                required
                min="0"
                @input="validateForm"
              >
            </div>
            <div class="mb-3">
              <label for="editDescription" class="form-label">Description</label>
              <textarea id="editDescription" class="form-control" v-model="editData.description"></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label">Replace image (optional)</label>
              <input type="file" class="form-control" accept="image/*" @change="onFileChange">
            </div>

            <!-- Optional live preview of the new image -->
            <div v-if="preview" class="mb-2">
              <img :src="preview" class="rounded" style="height:100px;object-fit:cover">
            </div>

            <!-- Show current image if exists and no new preview selected -->
            <div v-else-if="editData.imageUrl" class="mb-2">
              <img :src="editData.imageUrl" class="rounded" style="height:100px;object-fit:cover">
            </div>

          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="!isFormValid">Update Product</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global bootstrap */
import { ref, watch, defineProps, defineEmits, onMounted, onBeforeUnmount } from 'vue'
import { updateProduct } from '@/services/productservice'
import { productApi } from '@/services/api'

const props = defineProps({
  product: { type: Object, default: null }
})
const emit = defineEmits(['updated'])

const editData = ref({
  id: null,
  name: '',
  price: 0,
  stock_quantity: 0,
  description: ''
})

// File handling for single image upload
const selectedFile = ref(null)
const preview = ref(null)
const isFormValid = ref(true)

function onFileChange(event) {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    // Create preview
    if (preview.value) {
      URL.revokeObjectURL(preview.value)
    }
    preview.value = URL.createObjectURL(file)
  }
}

function validateForm() {
  const isValid = editData.value.name && 
                  editData.value.price > 0 && 
                  editData.value.stock_quantity >= 0 &&
                  editData.value.id
  isFormValid.value = isValid
  console.log('Form validation result:', isValid)
  return isValid
}



// Watch for product changes to fill the form
watch(
    () => props.product,
    (p) => {
      if (p) {
        console.log('=== PRODUCT DATA RECEIVED IN EDIT MODAL ===')
        console.log('Raw product data:', p)
        console.log('Product ID:', p.id)
        console.log('Product name:', p.name)
        console.log('Product price:', p.price)
        console.log('Product stock_quantity:', p.stock_quantity)
        console.log('Product stockQuantity:', p.stockQuantity)
        console.log('All product fields:', Object.keys(p))
        
        // Handle different possible field names for stock quantity
        const stockQty = p.stock_quantity !== undefined ? p.stock_quantity : 
                        p.stockQuantity !== undefined ? p.stockQuantity : 0
        
        editData.value = { 
          ...p,
          stock_quantity: stockQty
        }
        
        console.log('Processed editData:', editData.value)
        
        // Clear file selection when switching product
        selectedFile.value = null
        if (preview.value) {
          URL.revokeObjectURL(preview.value)
          preview.value = null
        }
        
        // Validate form after data is loaded
        setTimeout(() => {
          validateForm()
        }, 100)
      }
    },
    { immediate: true }
)

async function submitEdit() {
  console.log('=== FORM SUBMIT TRIGGERED ===')
  
  // Prevent default form submission
  event.preventDefault()
  
  try {
    console.log('=== SUBMIT EDIT STARTED ===')
    console.log('Product ID:', editData.value.id)
    console.log('Product data:', editData.value)
    console.log('Selected file:', selectedFile.value)
    console.log('Form validation check...')
    
    // Validate required fields
    if (!editData.value.id) {
      throw new Error('Product ID is missing')
    }
    
    if (!editData.value.name || !editData.value.price || editData.value.stock_quantity === undefined) {
      throw new Error('Required fields are missing')
    }
    
    console.log('Validation passed, calling updateProduct...')
    const response = await updateProduct(editData.value.id, editData.value, selectedFile.value)
    console.log('Update response:', response)
    
    emit('updated', { ...editData.value })
    
    // Close modal
    const modalEl = document.getElementById('editProductModal')
    console.log('Modal element found:', !!modalEl)
    const instance = bootstrap.Modal.getInstance(modalEl)
    console.log('Modal instance found:', !!instance)
    if (instance) {
      console.log('Closing modal...')
      instance.hide()
    } else {
      console.log('No modal instance found, trying to hide manually...')
      modalEl.classList.remove('show')
      document.body.classList.remove('modal-open')
      const backdrop = document.querySelector('.modal-backdrop')
      if (backdrop) backdrop.remove()
    }
    
    // Clear form
    selectedFile.value = null
    if (preview.value) {
      URL.revokeObjectURL(preview.value)
      preview.value = null
    }
    
    console.log('=== SUBMIT EDIT COMPLETED SUCCESSFULLY ===')
  } catch (error) {
    console.error('=== SUBMIT EDIT FAILED ===')
    console.error('Error updating product:', error)
    console.error('Error details:', {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      data: error.response?.data
    })
    
    let errorMessage = 'Failed to update product. Please try again.'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }
    
    alert(errorMessage)
  }
}

onMounted(() => {
  const modalEl = document.getElementById('editProductModal')
  if (!bootstrap.Modal.getInstance(modalEl)) {
    new bootstrap.Modal(modalEl)
  }
  
  // Reset file input when modal closes
  modalEl?.addEventListener('hidden.bs.modal', () => {
    selectedFile.value = null
    if (preview.value) {
      URL.revokeObjectURL(preview.value)
      preview.value = null
    }
  })
})

onBeforeUnmount(() => {
  if (preview.value) {
    URL.revokeObjectURL(preview.value)
  }
})
</script>
<style scoped>
/* Adjust modal styling as needed */
</style>
