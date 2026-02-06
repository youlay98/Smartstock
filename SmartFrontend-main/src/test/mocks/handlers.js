import { http, HttpResponse } from 'msw'

// Mock data
const mockProducts = [
  {
    id: 1,
    name: 'Test Product 1',
    description: 'Test description 1',
    price: 99.99,
    category: 'Electronics',
    stock: 10,
    imageUrl: 'https://example.com/image1.jpg'
  },
  {
    id: 2,
    name: 'Test Product 2',
    description: 'Test description 2',
    price: 149.99,
    category: 'Books',
    stock: 5,
    imageUrl: 'https://example.com/image2.jpg'
  }
]

const mockUsers = [
  {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'CUSTOMER'
  }
]

const mockOrders = [
  {
    id: 1,
    userId: 1,
    status: 'PENDING',
    totalAmount: 99.99,
    items: [
      {
        productId: 1,
        quantity: 1,
        price: 99.99
      }
    ]
  }
]

const mockCart = {
  id: 1,
  userId: 1,
  items: [
    {
      productId: 1,
      quantity: 2,
      product: mockProducts[0]
    }
  ]
}

// API handlers
export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: mockUsers[0]
    })
  }),

  http.post('/api/auth/register', () => {
    return HttpResponse.json({
      message: 'User registered successfully',
      user: mockUsers[0]
    })
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json(mockUsers[0])
  }),

  // Product endpoints
  http.get('/api/products', () => {
    return HttpResponse.json(mockProducts)
  }),

  http.get('/api/products/:id', ({ params }) => {
    const product = mockProducts.find(p => p.id === parseInt(params.id))
    if (!product) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(product)
  }),

  http.post('/api/products', () => {
    return HttpResponse.json({
      id: 3,
      name: 'New Product',
      description: 'New description',
      price: 199.99,
      category: 'Electronics',
      stock: 15,
      imageUrl: 'https://example.com/image3.jpg'
    })
  }),

  http.put('/api/products/:id', () => {
    return HttpResponse.json({ message: 'Product updated successfully' })
  }),

  http.delete('/api/products/:id', () => {
    return HttpResponse.json({ message: 'Product deleted successfully' })
  }),

  // Cart endpoints
  http.get('/api/cart', () => {
    return HttpResponse.json(mockCart)
  }),

  http.post('/api/cart/items', () => {
    return HttpResponse.json({ message: 'Item added to cart' })
  }),

  http.put('/api/cart/items/:productId', () => {
    return HttpResponse.json({ message: 'Cart item updated' })
  }),

  http.delete('/api/cart/items/:productId', () => {
    return HttpResponse.json({ message: 'Item removed from cart' })
  }),

  // Order endpoints
  http.get('/api/orders', () => {
    return HttpResponse.json(mockOrders)
  }),

  http.post('/api/orders', () => {
    return HttpResponse.json({
      id: 2,
      userId: 1,
      status: 'PENDING',
      totalAmount: 199.98,
      items: []
    })
  }),

  http.get('/api/orders/:id', ({ params }) => {
    const order = mockOrders.find(o => o.id === parseInt(params.id))
    if (!order) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(order)
  }),

  // Customer endpoints
  http.get('/api/customers', () => {
    return HttpResponse.json(mockUsers)
  }),

  http.get('/api/customers/:id', ({ params }) => {
    const customer = mockUsers.find(u => u.id === parseInt(params.id))
    if (!customer) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(customer)
  }),

  // Category endpoints
  http.get('/api/categories', () => {
    return HttpResponse.json([
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Books' },
      { id: 3, name: 'Clothing' }
    ])
  }),

  // Review endpoints
  http.get('/api/products/:productId/reviews', () => {
    return HttpResponse.json([
      {
        id: 1,
        productId: 1,
        userId: 1,
        rating: 5,
        comment: 'Great product!',
        createdAt: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  http.post('/api/products/:productId/reviews', () => {
    return HttpResponse.json({
      id: 2,
      productId: 1,
      userId: 1,
      rating: 4,
      comment: 'Good product',
      createdAt: '2024-01-02T00:00:00Z'
    })
  }),

  // Notification endpoints
  http.get('/api/notifications', () => {
    return HttpResponse.json([
      {
        id: 1,
        userId: 1,
        message: 'Test notification',
        read: false,
        createdAt: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  http.put('/api/notifications/:id/read', () => {
    return HttpResponse.json({ message: 'Notification marked as read' })
  }),

  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'UP' })
  }),

  // Catch-all handler for unmatched requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled request: ${request.method} ${request.url}`)
    return new HttpResponse(null, { status: 404 })
  })
] 