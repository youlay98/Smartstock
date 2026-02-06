import { categoryApi } from './api'

// Get all categories
export function getAllCategories() {
  return categoryApi.get('')
}

// Get category by ID
export function getCategoryById(id) {
  return categoryApi.get(`/${id}`)
}

// Create new category (Admin only)
export function createCategory(categoryData) {
  return categoryApi.post('', categoryData)
}

// Update category (Admin only)
export function updateCategory(id, categoryData) {
  return categoryApi.put(`/${id}`, categoryData)
}

// Delete category (Admin only)
export function deleteCategory(id) {
  return categoryApi.delete(`/${id}`)
} 