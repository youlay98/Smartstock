<template>
  <form @submit.prevent="handleSubmit" class="product-form">
    <div class="row">
      <!-- Basic Information -->
      <div class="col-md-8">
        <div class="form-section">
          <h5 class="section-title">Basic Information</h5>
          
          <AppInput
            v-model="formData.name"
            label="Product Name"
            placeholder="Enter product name"
            :error="errors.name"
            required
            :disabled="isSubmitting"
          />
          
          <AppSelect
            v-model="formData.categoryId"
            :options="categoryOptions"
            label="Category"
            placeholder="Select a category"
            :error="errors.categoryId"
            required
            :disabled="isSubmitting"
          />
          
          <div class="row">
            <div class="col-md-6">
              <AppInput
                v-model.number="formData.price"
                type="number"
                label="Price (€)"
                placeholder="0.00"
                step="0.01"
                min="0"
                :error="errors.price"
                required
                :disabled="isSubmitting"
              />
            </div>
            <div class="col-md-6">
              <AppInput
                v-model.number="formData.stockQuantity"
                type="number"
                label="Stock Quantity"
                placeholder="0"
                min="0"
                :error="errors.stockQuantity"
                required
                :disabled="isSubmitting"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea
              v-model="formData.description"
              class="form-control"
              :class="{ 'is-invalid': errors.description }"
              rows="4"
              placeholder="Enter product description..."
              :disabled="isSubmitting"
            ></textarea>
            <div v-if="errors.description" class="invalid-feedback d-block">
              {{ errors.description }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Image Upload -->
      <div class="col-md-4">
        <div class="form-section">
          <h5 class="section-title">Product Image</h5>
          
          <div class="image-upload-container">
            <div
              v-if="!imagePreview && !currentImage"
              class="upload-placeholder"
              @click="triggerFileInput"
              @dragover.prevent
              @drop.prevent="handleDrop"
            >
              <i class="bi bi-cloud-upload"></i>
              <p>Click to upload or drag & drop</p>
              <small>PNG, JPG up to 5MB</small>
            </div>
            
            <div v-else class="image-preview-container">
              <img
                :src="imagePreview || currentImage"
                :alt="formData.name || 'Product image'"
                class="image-preview"
              />
              <div class="image-overlay">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-light"
                  @click="triggerFileInput"
                  :disabled="isSubmitting"
                >
                  <i class="bi bi-pencil"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  @click="removeImage"
                  :disabled="isSubmitting"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
            
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="d-none"
              @change="handleFileSelect"
            />
          </div>
          
          <div v-if="errors.image" class="invalid-feedback d-block mt-2">
            {{ errors.image }}
          </div>
        </div>
      </div>
    </div>
    

    
    <!-- Form Actions -->
    <div class="form-actions">
      <AppButton
        type="button"
        variant="outline-secondary"
        @click="$emit('cancel')"
        :disabled="isSubmitting"
      >
        Cancel
      </AppButton>
      
      <AppButton
        type="submit"
        variant="primary"
        :loading="isSubmitting"
        :disabled="!isFormValid"
      >
        {{ isEdit ? 'Update Product' : 'Create Product' }}
      </AppButton>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppInput from '@/ui/atoms/AppInput.vue'
import AppSelect from '@/ui/atoms/AppSelect.vue'
import AppButton from '@/ui/atoms/AppButton.vue'
import { useProductStore } from '@/stores/products'

const props = defineProps({
  product: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'cancel'])

const productStore = useProductStore()

// Form data
const formData = ref({
  name: '',
  description: '',
  price: 0,
  stockQuantity: 0,
  categoryId: ''
})

// Form state
const errors = ref({})
const isSubmitting = ref(false)
const imageFile = ref(null)
const imagePreview = ref('')
const currentImage = ref('')
const fileInput = ref(null)

// Computed
const categoryOptions = computed(() => {
  return productStore.categories.map(category => ({
    value: category.id,
    label: category.name
  }))
})

const isFormValid = computed(() => {
  const isValid = formData.value.name && 
                  formData.value.price > 0 && 
                  formData.value.stockQuantity >= 0
  
  console.log('=== FORM VALIDATION CHECK ===')
  console.log('Name:', formData.value.name, 'Valid:', !!formData.value.name)
  console.log('Price:', formData.value.price, 'Valid:', formData.value.price > 0)
  console.log('Stock:', formData.value.stockQuantity, 'Valid:', formData.value.stockQuantity >= 0)
  console.log('Category ID:', formData.value.categoryId)
  console.log('Overall form valid:', isValid)
  
  return isValid
})

// Methods
const validateForm = () => {
  errors.value = {}
  
  if (!formData.value.name.trim()) {
    errors.value.name = 'Product name is required'
  }
  
  if (!formData.value.categoryId) {
    errors.value.categoryId = 'Category is required'
  }
  
  if (!formData.value.price || formData.value.price <= 0) {
    errors.value.price = 'Price must be greater than 0'
  }
  
  if (formData.value.stockQuantity < 0) {
    errors.value.stockQuantity = 'Stock quantity cannot be negative'
  }
  
  if (formData.value.description && formData.value.description.length > 1000) {
    errors.value.description = 'Description must be less than 1000 characters'
  }
  
  return Object.keys(errors.value).length === 0
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    validateAndSetImage(file)
  }
}

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file) {
    validateAndSetImage(file)
  }
}

const validateAndSetImage = (file) => {
  console.log('=== FILE VALIDATION DEBUG ===')
  console.log('File name:', file.name)
  console.log('File type:', file.type)
  console.log('File size:', file.size, 'bytes')
  console.log('File size (MB):', (file.size / (1024 * 1024)).toFixed(2), 'MB')
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    console.error('❌ Invalid file type:', file.type)
    errors.value.image = 'Please select a valid image file'
    return
  }
  
  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    console.error('❌ File too large:', (file.size / (1024 * 1024)).toFixed(2), 'MB')
    errors.value.image = 'Image size must be less than 5MB'
    return
  }
  
  console.log('✅ File validation passed')
  
  // Clear previous errors
  delete errors.value.image
  
  // Set file and preview
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
  
  console.log('✅ File set successfully')
}

const removeImage = () => {
  imageFile.value = null
  imagePreview.value = ''
  currentImage.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const testButtonClick = () => {
  console.log('=== BUTTON CLICK DETECTED ===')
  console.log('Button clicked!')
  console.log('Form valid:', isFormValid.value)
  console.log('Form data:', formData.value)
  console.log('Is submitting:', isSubmitting.value)
  alert('Button click detected! Check console for details.')
}

const testFormSubmit = () => {
  console.log('=== FORM SUBMIT EVENT DETECTED ===')
  console.log('Form submit event triggered!')
}

const handleSubmit = async (event) => {
  console.log('=== PRODUCT FORM HANDLE SUBMIT CALLED ===')
  console.log('Event:', event)
  console.log('Form data:', formData.value)
  console.log('Is submitting:', isSubmitting.value)
  console.log('Is form valid:', isFormValid.value)
  console.log('Props product:', props.product)
  console.log('Props mode:', props.isEdit)
  
  if (isSubmitting.value) {
    console.log('❌ Already submitting, blocking duplicate submission')
    return
  }

  if (!isFormValid.value) {
    console.log('❌ Form is not valid, blocking submission')
    console.log('Form validation details:')
    console.log('- Name:', formData.value.name, 'Valid:', !!formData.value.name)
    console.log('- Price:', formData.value.price, 'Valid:', formData.value.price > 0)
    console.log('- Stock:', formData.value.stockQuantity, 'Valid:', formData.value.stockQuantity >= 0)
    return
  }

  console.log('✅ Form is valid, proceeding with submission')
  isSubmitting.value = true

  try {
    const fileToUpload = imageFile.value
    console.log('Image file:', fileToUpload)
    
    console.log('Emitting submit event with:', {
      productData: formData.value,
      imageFile: fileToUpload
    })
    
    emit('submit', {
      productData: formData.value,
      imageFile: fileToUpload
    })
    
    console.log('✅ Submit event emitted successfully')
  } catch (error) {
    console.error('❌ Error in handleSubmit:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Initialize form with product data if editing
const initializeForm = () => {
  if (props.product) {
    console.log('=== INITIALIZING PRODUCT FORM ===')
    console.log('Raw product data:', props.product)
    console.log('Product stock_quantity:', props.product.stock_quantity)
    console.log('Product stockQuantity:', props.product.stockQuantity || props.product.stock_quantity)
    
    // Handle both camelCase and snake_case field names
    const stockQty = props.product.stock_quantity !== undefined ? props.product.stock_quantity : 
                    (props.product.stockQuantity || props.product.stock_quantity) !== undefined ? (props.product.stockQuantity || props.product.stock_quantity) : 0
    
    formData.value = {
      name: props.product.name || '',
      description: props.product.description || '',
      price: props.product.price || 0,
      stockQuantity: stockQty,
      categoryId: props.product.categoryId || props.product.category_id || ''
    }
    
    console.log('Initialized form data:', formData.value)
    
    if (props.product.imageUrl) {
      currentImage.value = props.product.imageUrl
    }
  }
}

// Watch for product changes
watch(() => props.product, initializeForm, { immediate: true })

// Load categories on mount
onMounted(async () => {
  console.log('=== PRODUCT FORM MOUNTED ===')
  console.log('Is edit mode:', props.isEdit)
  console.log('Product prop:', props.product)
  console.log('Initial form data:', formData.value)
  
  if (productStore.categories.length === 0) {
    console.log('Loading categories...')
    await productStore.loadCategories()
    console.log('Categories loaded:', productStore.categories.length)
  } else {
    console.log('Categories already loaded:', productStore.categories.length)
  }
  
  // Force validation check after mount
  setTimeout(() => {
    console.log('=== POST-MOUNT VALIDATION ===')
    console.log('Form valid:', isFormValid.value)
    console.log('Form data:', formData.value)
  }, 100)
})
</script>

<style scoped>
.product-form {
  padding: var(--spacing-lg);
}

.form-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-light);
}

.image-upload-container {
  border: 2px dashed var(--color-border-medium);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition-fast);
}

.image-upload-container:hover {
  border-color: var(--color-primary);
}

.upload-placeholder {
  padding: var(--spacing-xl);
  text-align: center;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: var(--transition-fast);
}

.upload-placeholder:hover {
  background-color: var(--color-gray-50);
}

.upload-placeholder i {
  font-size: 2rem;
  margin-bottom: var(--spacing-sm);
  color: var(--color-gray-400);
}

.upload-placeholder p {
  margin-bottom: var(--spacing-xs);
  font-weight: var(--font-weight-medium);
}

.upload-placeholder small {
  color: var(--color-text-tertiary);
}

.image-preview-container {
  position: relative;
  aspect-ratio: 1;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  opacity: 0;
  transition: var(--transition-fast);
}

.image-preview-container:hover .image-overlay {
  opacity: 1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
}

@media (max-width: 768px) {
  .product-form {
    padding: var(--spacing-md);
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .btn {
    width: 100%;
  }
}
</style> 