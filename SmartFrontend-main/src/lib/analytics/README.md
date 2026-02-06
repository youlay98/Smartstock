# Analytics Data Facade

This directory contains the data layer for the analytics dashboard, providing a clean interface between the UI components and the backend APIs.

## Architecture

### useAnalytics Composable

The main composable that handles all analytics data fetching and transformation.

**Features:**
- SWR-like caching with stale-while-revalidate
- Debounced data fetching for time range changes
- Real-time data transformations
- Error handling and loading states
- Subscription system for data updates

**Usage:**
```javascript
import { useAnalytics } from '@/lib/analytics/useAnalytics'

const { 
  metrics, 
  salesTrend, 
  topProducts, 
  customerDemographics,
  inventoryLevels,
  recentActivities,
  isLoading,
  error,
  refresh 
} = useAnalytics(30) // 30 days time range
```

## Data Sources

### Existing Endpoints Used
1. **Orders API:** `GET /api/orders` (via `getAllOrders()`)
2. **Products API:** `GET /api/products` (via `getAllProducts()`)
3. **Customers API:** `GET /api/customers` (via `getAllCustomers()`)

### Data Transformations

#### KPI Metrics
- **Total Orders:** Count of orders within date range
- **Total Revenue:** Sum of order amounts within date range
- **New Customers:** Count of customers registered within date range
- **Low Stock Items:** Count of products below minimum stock level

#### Sales Trend
- Groups orders by date
- Calculates daily order count and revenue
- Returns time series data for charting

#### Top Products
- Extracts product data from order items
- Aggregates by product name
- Sorts by revenue (descending)
- Returns top 5 products

#### Customer Demographics
- Categorizes customers based on:
  - **New:** Registered in last 30 days
  - **Returning:** 2-10 orders
  - **VIP:** 10+ orders
  - **Inactive:** No orders in last 90 days

#### Inventory Levels
- Categorizes products by stock status:
  - **In Stock:** Above minimum level
  - **Low Stock:** Below minimum but > 0
  - **Out of Stock:** Quantity = 0
  - **Discontinued:** Status = 'discontinued'

#### Recent Activities
- Combines recent events from all sources
- Includes orders, customer registrations, and stock alerts
- Sorted by timestamp (most recent first)

## Performance Optimizations

### Caching
- 5-minute cache for each time range
- Automatic cache invalidation
- Stale-while-revalidate pattern

### Debouncing
- 300ms debounce for time range changes
- Prevents excessive API calls

### Memoization
- Computed properties for expensive transformations
- Reactive updates only when data changes

## Error Handling

- Graceful degradation when APIs fail
- User-friendly error messages
- Retry functionality
- Fallback to cached data when available

## Future Enhancements

### Backend Optimizations
- Dedicated analytics endpoints for better performance
- Historical data for change calculations
- Real-time updates via WebSocket
- Aggregated data endpoints

### Frontend Enhancements
- Cross-filtering between charts
- Export functionality (CSV, PDF)
- Custom date ranges
- Drill-down capabilities
- Real-time polling for KPIs

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_DEFAULT_TIMEZONE=Europe/Berlin
VITE_DEFAULT_CURRENCY=EUR
VITE_ANALYTICS_CACHE_DURATION=300000
VITE_ANALYTICS_DEBOUNCE_DELAY=300
``` 