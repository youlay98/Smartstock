import { reviewApi } from './api'

// Get reviews for a product with pagination
export function getProductReviews(productId, page = 0, size = 10) {
  return reviewApi.get(`/${productId}/reviews`, {
    params: { page, size }
  })
}

// Get review summary for a product
export function getProductReviewSummary(productId) {
  return reviewApi.get(`/${productId}/reviews/summary`)
}

// Create or update a review for a product
export function createOrUpdateReview(productId, reviewData) {
  return reviewApi.post(`/${productId}/reviews`, reviewData)
}

// Delete a review
export function deleteReview(productId, reviewId) {
  return reviewApi.delete(`/${productId}/reviews/${reviewId}`)
} 