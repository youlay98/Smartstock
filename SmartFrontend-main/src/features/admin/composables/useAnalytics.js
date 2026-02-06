import { ref, computed, readonly } from 'vue'
import { getAllOrders } from '@/services/orderService'
import { getAllProducts } from '@/services/productservice'
import { getAllCustomers } from '@/services/customerService'

export function useAnalytics() {
  // State
  const isLoading = ref(false)
  const error = ref(null)
  const orders = ref([])
  const products = ref([])
  const customers = ref([])
  const lastUpdated = ref(null)

  // Computed metrics
  const metrics = computed(() => {
    const totalOrders = orders.value.length
    const totalRevenue = orders.value.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const lowStockItems = products.value.filter(p => (p.stockQuantity || 0) < (p.minStockLevel || 10)).length
    const outOfStockItems = products.value.filter(p => (p.stockQuantity || 0) === 0).length

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      lowStockItems,
      outOfStockItems,
      totalProducts: products.value.length,
      totalCustomers: customers.value.length
    }
  })

  // Computed chart data
  const salesTrendData = computed(() => {
    const days = 30
    const labels = []
    const orderData = []
    const revenueData = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      labels.push(date.toLocaleDateString())
      
      // Filter orders for this date
      const dayOrders = orders.value.filter(order => {
        const orderDate = new Date(order.createdAt || order.orderDate)
        return orderDate.toISOString().split('T')[0] === dateStr
      })
      
      orderData.push(dayOrders.length)
      revenueData.push(dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0))
    }

    return { labels, orderData, revenueData }
  })

  const topProductsData = computed(() => {
    // Group products by sales (mock data for now)
    const productSales = products.value.map((product, index) => ({
      name: product.name || `Product ${index + 1}`,
      sales: Math.floor(Math.random() * 100) + 10,
      revenue: Math.floor(Math.random() * 1000) + 100
    }))

    return productSales
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10)
  })

  const customerDemographicsData = computed(() => {
    const total = customers.value.length
    if (total === 0) return []

    // Mock demographic data
    return [
      { value: Math.floor(total * 0.4), name: 'New Customers' },
      { value: Math.floor(total * 0.35), name: 'Returning Customers' },
      { value: Math.floor(total * 0.15), name: 'VIP Customers' },
      { value: Math.floor(total * 0.1), name: 'Inactive Customers' }
    ]
  })

  const stockLevelsData = computed(() => {
    const total = products.value.length
    if (total === 0) return []

    const inStock = products.value.filter(p => (p.stockQuantity || 0) > (p.minStockLevel || 10)).length
    const lowStock = products.value.filter(p => {
      const stock = p.stockQuantity || 0
      const minLevel = p.minStockLevel || 10
      return stock > 0 && stock <= minLevel
    }).length
    const outOfStock = products.value.filter(p => (p.stockQuantity || 0) === 0).length
    const discontinued = total - inStock - lowStock - outOfStock

    return [
      { value: inStock, name: 'In Stock' },
      { value: lowStock, name: 'Low Stock' },
      { value: outOfStock, name: 'Out of Stock' },
      { value: discontinued, name: 'Discontinued' }
    ]
  })

  // Methods
  const loadData = async () => {
    try {
      isLoading.value = true
      error.value = null

      const [ordersResponse, productsResponse, customersResponse] = await Promise.all([
        getAllOrders(),
        getAllProducts(),
        getAllCustomers()
      ])

      orders.value = ordersResponse.data || []
      products.value = productsResponse.data || []
      customers.value = customersResponse.data || []
      lastUpdated.value = new Date()

    } catch (err) {
      console.error('Error loading analytics data:', err)
      error.value = err.message || 'Failed to load analytics data'
    } finally {
      isLoading.value = false
    }
  }

  const refreshData = () => {
    return loadData()
  }

  const getTimeRangeData = (days) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const filteredOrders = orders.value.filter(order => {
      const orderDate = new Date(order.createdAt || order.orderDate)
      return orderDate >= cutoffDate
    })

    const filteredCustomers = customers.value.filter(customer => {
      const customerDate = new Date(customer.createdAt || customer.registrationDate)
      return customerDate >= cutoffDate
    })

    return {
      orders: filteredOrders,
      customers: filteredCustomers,
      products: products.value // Products don't have time-based filtering
    }
  }

  const exportChartData = (chartType) => {
    const data = {
      salesTrend: salesTrendData.value,
      topProducts: topProductsData.value,
      customerDemographics: customerDemographicsData.value,
      stockLevels: stockLevelsData.value
    }

    const chartData = data[chartType]
    if (!chartData) return null

    const csvContent = convertToCSV(chartData, chartType)
    downloadCSV(csvContent, `${chartType}_${new Date().toISOString().split('T')[0]}.csv`)
  }

  const convertToCSV = (data, chartType) => {
    let csv = ''
    
    switch (chartType) {
      case 'salesTrend':
        csv = 'Date,Orders,Revenue\n'
        data.labels.forEach((label, index) => {
          csv += `${label},${data.orderData[index]},${data.revenueData[index]}\n`
        })
        break
      
      case 'topProducts':
        csv = 'Product,Sales,Revenue\n'
        data.forEach(item => {
          csv += `${item.name},${item.sales},${item.revenue}\n`
        })
        break
      
      case 'customerDemographics':
      case 'stockLevels':
        csv = 'Category,Value\n'
        data.forEach(item => {
          csv += `${item.name},${item.value}\n`
        })
        break
    }
    
    return csv
  }

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),
    orders: readonly(orders),
    products: readonly(products),
    customers: readonly(customers),
    lastUpdated: readonly(lastUpdated),

    // Computed
    metrics,
    salesTrendData,
    topProductsData,
    customerDemographicsData,
    stockLevelsData,

    // Methods
    loadData,
    refreshData,
    getTimeRangeData,
    exportChartData
  }
} 