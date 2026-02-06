# SmartStock Frontend

A Vue.js 3 frontend application for the SmartStock e-commerce platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend services running (see backend README)

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API Configuration
VITE_API_GATEWAY_BASE_URL=http://localhost:8085
VITE_CART_SERVICE_URL=http://localhost:8087

# Development Configuration
VITE_APP_TITLE=SmartStock
VITE_APP_VERSION=1.0.0
```

### Backend Services

The frontend connects to the following backend services:

- **ProductService**: `http://localhost:8085` - Products, categories, reviews, notifications
- **CartService**: `http://localhost:8087` - Shopping cart operations

## 📁 Project Structure

```
src/
├── components/          # Reusable Vue components
├── services/           # API service layer
│   ├── api.js         # Base API configuration
│   ├── productservice.js
│   ├── cartService.js
│   ├── authService.js
│   └── ...
├── stores/            # Pinia state management
│   ├── auth.js
│   ├── cart.js
│   ├── products.js
│   └── ...
├── views/             # Page components
├── router/            # Vue Router configuration
└── assets/            # Static assets
```

## 🔌 API Integration

### Authentication
- JWT-based authentication
- Automatic token inclusion in requests
- Automatic redirect to login on auth errors

### Cart Operations
- Add/remove items
- Update quantities
- Price synchronization with ProductService
- Persistent cart state

### Product Management
- CRUD operations for products
- Category management
- Review system
- Image upload support

## 🛠️ Development

### Adding New API Endpoints

1. Update the appropriate service file in `src/services/`
2. Add the endpoint to the corresponding API instance in `src/services/api.js`
3. Update the store if needed
4. Create/update components to use the new functionality

### State Management

The application uses Pinia for state management:

- `auth` store: User authentication and authorization
- `cart` store: Shopping cart state and operations
- `products` store: Product catalog and management
- `notifications` store: Admin notifications

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui

# Run E2E tests
npm run cypress:open
```

## 🚀 Deployment

1. Build the application: `npm run build`
2. Deploy the `dist/` folder to your web server
3. Ensure environment variables are configured for production

## 📝 Notes

- The frontend automatically handles authentication errors and redirects to login
- Cart operations are synchronized with the backend CartService
- Product images are stored in MinIO and served through the ProductService
- All API calls include proper error handling and user feedback via toast notifications
