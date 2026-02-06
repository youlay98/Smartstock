import { ref, computed, watch, readonly } from 'vue'
import { getAllOrders } from '@/services/orderService'
import { getAllProducts } from '@/services/productservice'
import { getAllCustomers } from '@/services/customerService'

// SWR-like state management
const cache = new Map()
const subscribers = new Map()

// Debounce function
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function useAnalytics(timeRange = 30) {
  // Reactive state
  const isLoading = ref(false)
  const error = ref(null)
  const lastUpdated = ref(null)
  const data = ref({
    orders: [],
    products: [],
    customers: []
  })

  // Cache key for current time range
  const cacheKey = `analytics_${timeRange}`

  // Check if we have cached data
  const hasCachedData = computed(() => {
    return cache.has(cacheKey) && cache.get(cacheKey).timestamp > Date.now() - 5 * 60 * 1000 // 5 minutes
  })

  // Fetch data function
  const fetchData = async (forceRefresh = false) => {
    if (!forceRefresh && hasCachedData.value) {
      const cached = cache.get(cacheKey)
      data.value = cached.data
      lastUpdated.value = cached.timestamp
      return
    }

    try {
      isLoading.value = true
      error.value = null

      console.log('🔍 Fetching analytics data...')

      // Fetch all data in parallel
      const [ordersResponse, productsResponse, customersResponse] = await Promise.all([
        getAllOrders(),
        getAllProducts(),
        getAllCustomers()
      ])

      console.log('📊 API Responses:', {
        orders: ordersResponse,
        products: productsResponse,
        customers: customersResponse
      })

      const newData = {
        orders: ordersResponse.data || [],
        products: productsResponse.data || [],
        customers: customersResponse.data || []
      }

      console.log('📈 Processed data:', {
        ordersCount: newData.orders.length,
        productsCount: newData.products.length,
        customersCount: newData.customers.length
      })

      // Cache the data
      cache.set(cacheKey, {
        data: newData,
        timestamp: Date.now()
      })

      data.value = newData
      lastUpdated.value = Date.now()

      // Notify subscribers
      if (subscribers.has(cacheKey)) {
        subscribers.get(cacheKey).forEach(callback => callback(newData))
      }

    } catch (err) {
      console.error('❌ Error fetching analytics data:', err)
      error.value = err.message || 'Failed to fetch analytics data'
    } finally {
      isLoading.value = false
    }
  }

  // Debounced fetch for time range changes
  const debouncedFetch = debounce(fetchData, 300)

  // Watch for time range changes
  watch(() => timeRange, (newRange) => {
    if (newRange !== timeRange) {
      debouncedFetch()
    }
  })

  // Initial fetch
  fetchData()

  // Computed metrics
  const metrics = computed(() => {
    const { orders, products, customers } = data.value

    console.log('🧮 Computing metrics with data:', {
      ordersCount: orders.length,
      productsCount: products.length,
      customersCount: customers.length,
      timeRange
    })

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeRange)

    // Filter data by date range
    const recentOrders = orders.filter(order => {
      try {
        const orderDate = new Date(order.createdAt || order.orderDate)
        return !isNaN(orderDate.getTime()) && orderDate >= startDate && orderDate <= endDate
      } catch (error) {
        console.warn('Invalid order date:', order.createdAt || order.orderDate)
        return false
      }
    })

    const recentCustomers = customers.filter(customer => {
      try {
        const customerDate = new Date(customer.createdAt || customer.registrationDate)
        return !isNaN(customerDate.getTime()) && customerDate >= startDate && customerDate <= endDate
      } catch (error) {
        console.warn('Invalid customer date:', customer.createdAt || customer.registrationDate)
        return false
      }
    })

    // Calculate metrics
    const totalOrders = recentOrders.length
    const totalRevenue = recentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const newCustomers = recentCustomers.length
    
    // Debug low stock calculation
    const lowStockProducts = products.filter(p => (p.stockQuantity || p.stock_quantity || 0) < 5)
    const lowStockItems = lowStockProducts.length
    
    console.log('🔍 Low stock calculation debug:', {
      totalProducts: products.length,
      lowStockCount: lowStockItems,
      lowStockProducts: lowStockProducts.map(p => ({
        id: p.id,
        name: p.name,
        stockQuantity: p.stockQuantity || p.stock_quantity
      }))
    })

    // Calculate changes (mock for now - would need historical data)
    const orderChange = 12.5 // Mock
    const revenueChange = 8.3 // Mock
    const customerChange = 15.7 // Mock
    const stockChange = -5.2 // Mock

    const result = {
      totalOrders,
      totalRevenue,
      newCustomers,
      lowStockItems,
      orderChange,
      revenueChange,
      customerChange,
      stockChange
    }

    console.log('📊 Computed metrics:', result)

    return result
  })

  // Sales trend data
  const salesTrend = computed(() => {
    const { orders } = data.value
    
    // Generate date labels for the time range
    const labels = []
    const ordersData = []
    const revenueData = []
    
    for (let i = timeRange - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString()
      labels.push(dateStr)
      
      // Filter orders for this date
      const dayOrders = orders.filter(order => {
        try {
          const orderDate = new Date(order.createdAt || order.orderDate)
          return !isNaN(orderDate.getTime()) && orderDate.toDateString() === date.toDateString()
        } catch (error) {
          console.warn('Invalid order date in sales trend:', order.createdAt || order.orderDate)
          return false
        }
      })
      
      ordersData.push(dayOrders.length)
      revenueData.push(dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0))
    }

    return {
      labels,
      orders: ordersData,
      revenue: revenueData
    }
  })

  // Top products data
  const topProducts = computed(() => {
    const { orders, products } = data.value
    
    console.log('🔍 Computing top products with:', {
      ordersCount: orders.length,
      productsCount: products.length,
      sampleOrder: orders[0],
      sampleProduct: products[0]
    })
    
    // Extract product sales from orders
    const productSales = new Map()
    
    orders.forEach(order => {
      console.log('📦 Processing order:', order.id, 'items:', order.items)
      
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          console.log('📋 Processing item:', item)
          const productId = item.productId || item.id
          const product = products.find(p => p.id === productId)
          const productName = product?.name || `Product ${productId}`
          
          if (productSales.has(productName)) {
            productSales.set(productName, {
              units: productSales.get(productName).units + (item.quantity || 1),
              revenue: productSales.get(productName).revenue + (item.totalPrice || item.unitPrice || 0)
            })
          } else {
            productSales.set(productName, {
              units: item.quantity || 1,
              revenue: item.totalPrice || item.unitPrice || 0
            })
          }
        })
      } else {
        // If no items array, try to use the order itself as a product
        const productName = `Order ${order.id}`
        const revenue = order.totalAmount || 0
        
        if (productSales.has(productName)) {
          productSales.set(productName, {
            units: productSales.get(productName).units + 1,
            revenue: productSales.get(productName).revenue + revenue
          })
        } else {
          productSales.set(productName, {
            units: 1,
            revenue: revenue
          })
        }
      }
    })
    
    const result = Array.from(productSales.entries())
      .map(([name, data]) => ({
        productName: name,
        units: data.units,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5) // Top 5 products
    
    console.log('🏆 Top products result:', result)
    return result
  })

  // Customer demographics data
  const customerDemographics = computed(() => {
    const { customers, orders } = data.value
    
    // Categorize customers
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    
    let newCustomers = 0
    let returningCustomers = 0
    let vipCustomers = 0
    let inactiveCustomers = 0
    
    customers.forEach(customer => {
      try {
        const customerDate = new Date(customer.createdAt || customer.registrationDate)
        
        // Skip invalid dates
        if (isNaN(customerDate.getTime())) {
          console.warn('Invalid customer date:', customer.createdAt || customer.registrationDate)
          returningCustomers++ // Default to returning
          return
        }
        
        // Count customer orders
        const customerOrders = orders.filter(order => 
          order.customerId === customer.id || order.userId === customer.id
        )
        
        if (customerDate >= thirtyDaysAgo) {
          newCustomers++
        } else if (customerOrders.length >= 10) {
          vipCustomers++
        } else if (customerOrders.length >= 2) {
          returningCustomers++
        } else if (customerDate < ninetyDaysAgo && customerOrders.length === 0) {
          inactiveCustomers++
        } else {
          returningCustomers++ // Default to returning
        }
      } catch (error) {
        console.warn('Error processing customer:', customer, error)
        returningCustomers++ // Default to returning
      }
    })
    
    return {
      new: newCustomers,
      returning: returningCustomers,
      vip: vipCustomers,
      inactive: inactiveCustomers
    }
  })

  // Inventory levels data
  const inventoryLevels = computed(() => {
    const { products } = data.value
    
    console.log('📦 Computing inventory levels with products:', products.length)
    console.log('📋 Sample product data structure:', products[0])
    
    let inStock = 0
    let lowStock = 0
    let outOfStock = 0
    let discontinued = 0
    
    products.forEach(product => {
      // Handle both camelCase and snake_case field names
      const stockQuantity = product.stockQuantity || product.stock_quantity || 0
      const status = product.status || 'active'
      
      console.log(`📋 Product ${product.name || product.id}: stock=${stockQuantity}, status=${status}`)
      
      if (status === 'discontinued') {
        discontinued++
      } else if (stockQuantity === 0) {
        outOfStock++
      } else if (stockQuantity < 5) { // Use new threshold of 5 for low stock
        lowStock++
      } else {
        inStock++
      }
    })
    
    const result = {
      inStock,
      lowStock,
      outOfStock,
      discontinued
    }
    
    console.log('📊 Inventory levels result:', result)
    console.log('📋 Inventory levels debug - all products:', products.map(p => ({
      id: p.id,
      name: p.name,
      stockQuantity: p.stockQuantity || p.stock_quantity,
      status: p.status || 'active',
      category: p.category || 'In Stock'
    })))
    return result
  })

  // Recent activities data
  const recentActivities = computed(() => {
    const { orders, products, customers } = data.value
    const activities = []
    
    // Add recent orders
    orders.slice(0, 5).forEach(order => {
      try {
        const orderDate = new Date(order.createdAt || order.orderDate)
        if (!isNaN(orderDate.getTime())) {
          activities.push({
            id: `order-${order.id}`,
            type: 'order',
            description: `New order #${order.id} placed`,
            amount: order.totalAmount || 0,
            timestamp: orderDate,
            status: order.status || 'completed'
          })
        }
      } catch (error) {
        console.warn('Invalid order date for activity:', order.createdAt || order.orderDate)
      }
    })
    
    // Add recent customers
    customers.slice(0, 3).forEach(customer => {
      try {
        const customerDate = new Date(customer.createdAt || customer.registrationDate)
        if (!isNaN(customerDate.getTime())) {
          activities.push({
            id: `customer-${customer.id}`,
            type: 'customer',
            description: `New customer registered: ${customer.name || customer.username}`,
            amount: 0,
            timestamp: customerDate,
            status: 'completed'
          })
        }
      } catch (error) {
        console.warn('Invalid customer date for activity:', customer.createdAt || customer.registrationDate)
      }
    })
    
    // Add low stock alerts
    const lowStockProducts = products.filter(p => 
      (p.stockQuantity || p.stock_quantity || 0) < 5 && (p.stockQuantity || p.stock_quantity || 0) > 0
    ).slice(0, 2)
    
    lowStockProducts.forEach(product => {
      activities.push({
        id: `stock-${product.id}`,
        type: 'stock',
        description: `Low stock alert: ${product.name}`,
        amount: 0,
        timestamp: new Date(),
        status: 'warning'
      })
    })
    
    // Sort by timestamp and return recent activities
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
  })

  // Refresh function
  const refresh = () => {
    fetchData(true)
  }

  // Subscribe to data changes
  const subscribe = (callback) => {
    if (!subscribers.has(cacheKey)) {
      subscribers.set(cacheKey, new Set())
    }
    subscribers.get(cacheKey).add(callback)
    
    // Return unsubscribe function
    return () => {
      if (subscribers.has(cacheKey)) {
        subscribers.get(cacheKey).delete(callback)
      }
    }
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),
    lastUpdated: readonly(lastUpdated),
    data: readonly(data),
    
    // Computed data
    metrics,
    salesTrend,
    topProducts,
    customerDemographics,
    inventoryLevels,
    recentActivities,
    
    // Actions
    refresh,
    subscribe,
    
    // Utilities
    hasCachedData
  }
} 