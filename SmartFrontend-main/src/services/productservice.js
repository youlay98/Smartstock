
import { productApi } from './api'
import { showSuccessToast } from './api'

/**
 * Build a multipart/form‑data body.
 * @param {Object}   product   – plain JS object (name, price …)
 * @param {File[]}   files     – array (can be empty / undefined)
 */
function toFormData(product, files = []) {
    const fd = new FormData()
    fd.append('product', new Blob([JSON.stringify(product)],
        { type: 'application/json' }))

    files.forEach(f => fd.append('file', f))   // **note singular: "file"**
    return fd
}

/* ────────── CRUD ────────── */

export function createProduct(product, file) {
    const fd = new FormData()
    fd.append('product', new Blob([JSON.stringify(product)], { type: 'application/json' }))
    if (file) fd.append('file', file)

    console.log('=== CREATE PRODUCT DEBUG ===')
    console.log('Product data:', product)
    console.log('File:', file)
    console.log('FormData entries:')
    for (let [key, value] of fd.entries()) {
        console.log(`${key}:`, value)
    }

    return productApi.post('', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(response => {
        showSuccessToast('Product created successfully!')
        return response
    }).catch(error => {
        console.error('=== CREATE PRODUCT ERROR DEBUG ===')
        console.error('Error details:', error)
        console.error('Request config:', error.config)
        console.error('Response:', error.response)
        throw error
    })
}

export function getProductById(id) { 
    return productApi.get(`/${id}`) 
}

export function getAllProducts(params = {}) { 
    return productApi.get('', { params }) 
}

export function updateProduct(productId, product, file) {
    console.log('updateProduct called with:', { productId, product, file })
    
    const fd = new FormData()
    fd.append('product', new Blob([JSON.stringify(product)], { type: 'application/json' }))
    if (file) fd.append('file', file)

    return productApi.put(`/${productId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(response => {
        console.log('Product updated successfully:', response)
        showSuccessToast('Product updated successfully!')
        return response
    }).catch(error => {
        console.error('Error in updateProduct:', error)
        console.error('Error response:', error.response)
        console.error('Error status:', error.response?.status)
        console.error('Error data:', error.response?.data)
        throw error
    })
}

export function deleteProduct(id) { 
    return productApi.delete(`/${id}`).then(response => {
        showSuccessToast('Product deleted successfully!')
        return response
    })
}

export function reduceStock(id, qty) {
    return productApi.put(`/${id}/reduceStock`, null, { params: { quantity: qty } })
}

// Get product info for cart service
export function getProductInfo(id) {
    return productApi.get(`/${id}/info`)
}

// Get products by category
export function getProductsByCategory(categoryId) {
    return productApi.get('', { params: { categoryId } })
}

// Search products
export function searchProducts(query) {
    return productApi.get('', { params: { search: query } })
}
