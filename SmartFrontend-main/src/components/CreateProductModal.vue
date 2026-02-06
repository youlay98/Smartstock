<template>
  <!-- Bootstrap Modal for Creating Product -->
  <div class="modal fade" id="createProductModal" tabindex="-1"
       aria-labelledby="createProductModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <form @submit.prevent="submitCreate">
          <!-- ─────────────────── header ─────────────────── -->
          <div class="modal-header">
            <h5 class="modal-title" id="createProductModalLabel">Create Product</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"
                    aria-label="Close"></button>
          </div>

          <!-- ─────────────────── body ─────────────────── -->
          <div class="modal-body">
            <!-- existing text fields … -->
            <div class="mb-3">
              <label for="createName"  class="form-label">Product Name</label>
              <input  id="createName"  type="text"  class="form-control"
                      v-model="createData.name" required />
            </div>
            <div class="mb-3">
              <label for="createPrice" class="form-label">Price (€)</label>
              <input  id="createPrice" type="number" step="0.01"
                      class="form-control"
                      v-model.number="createData.price" required />
            </div>
            <div class="mb-3">
              <label for="createStock" class="form-label">Stock Quantity</label>
              <input  id="createStock" type="number" class="form-control"
                      v-model.number="createData.stock_quantity" required />
            </div>
            <div class="mb-3">
              <label for="createDescription" class="form-label">Description</label>
              <textarea id="createDescription" class="form-control"
                        v-model="createData.description"></textarea>
            </div>

            <!-- NEW: image‑picker -->
            <div class="mb-3">
              <label class="form-label">Image</label>
              <input type="file" class="form-control" accept="image/*" @change="onFile">
            </div>
            <div v-if="preview" class="mb-2">
              <img :src="preview" alt="preview" class="rounded" style="height:100px;object-fit:cover">
            </div>


          </div>

          <!-- ─────────────────── footer ─────────────────── -->
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting"
                    class="spinner-border spinner-border-sm me-2"
                    role="status" aria-hidden="true"></span>
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global bootstrap */
import { ref, onMounted } from 'vue'
import { createProduct } from '@/services/productservice'

const emit = defineEmits(['created'])

const createData = ref({ name: '', price: 0, stock_quantity: 0, description: '' })
const isSubmitting = ref(false)

const file = ref(null)     // single file
const preview = ref('')    // preview URL

function onFile (e) {
  const f = e.target.files?.[0]
  file.value = f || null
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = f ? URL.createObjectURL(f) : ''
}

let modalInstance = null
onMounted(() => {
  const el = document.getElementById('createProductModal')
  if (el) {
    modalInstance = new bootstrap.Modal(el)
    el.addEventListener('hidden.bs.modal', () => {
      // reset form and preview on close
      createData.value = { name: '', price: 0, stock_quantity: 0, description: '' }
      if (preview.value) URL.revokeObjectURL(preview.value)
      preview.value = ''
      file.value = null
    })
  }
})

const submitCreate = async () => {
  try {
    isSubmitting.value = true
    const { data } = await createProduct(createData.value, file.value)
    emit('created', data)
    if (modalInstance) modalInstance.hide()
  } catch (err) {
    console.error('Error creating product:', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

