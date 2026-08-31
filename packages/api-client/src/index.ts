/// <reference types="vite/client" />
import axios, { InternalAxiosRequestConfig } from 'axios';
import { useQuery, useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';

// ==========================================
// 1. API Clients Config
// ==========================================

export const ecommerceApi = axios.create({
  baseURL: (import.meta.env?.VITE_ECOMMERCE_API_URL as string) || 'http://localhost:9090',
});

export const hookRelayApi = axios.create({
  baseURL: (import.meta.env?.VITE_HOOKRELAY_API_URL as string) || 'http://localhost:8085',
});

// Request Interceptors for Injecting Tokens
ecommerceApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Storefront runs on port 3000, Seller Dashboard on port 3001
  const isSellerPort = window.location.port === '3001' || window.location.pathname.startsWith('/seller') || window.location.hostname.includes('seller');
  const token = localStorage.getItem(isSellerPort ? 'seller_token' : 'storefront_token');
  if (token) {
    config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  return config;
});

hookRelayApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('hookrelay_token');
  if (token) {
    config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  return config;
});

// Response Error Interceptors
const handleAuthError = (error: any) => {
  if (error.response?.status === 401) {
    const isSeller = window.location.port === '3001' || window.location.pathname.startsWith('/seller');
    const isConsole = window.location.port === '3002' || window.location.pathname.startsWith('/console') || window.location.hostname.includes('console');
    
    if (isSeller) {
      localStorage.removeItem('seller_token');
    } else if (isConsole) {
      localStorage.removeItem('hookrelay_token');
    } else {
      localStorage.removeItem('storefront_token');
    }
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

ecommerceApi.interceptors.response.use((r) => r, handleAuthError);
hookRelayApi.interceptors.response.use((r) => r, handleAuthError);

// ==========================================
// 2. Core Type Interfaces
// ==========================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'RETAILER';
}

export interface AuthResponse {
  token: string;
  email: string;
  name: string;
  role?: string;
}

export interface Product {
  id: string;
  retailerId: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  category: string;
  images?: string[];
  highlights?: string[];
  specifications?: { [key: string]: string };
  brand?: string;
  createdAt?: string;
  active: boolean;
  averageRating?: number;
  reviewCount?: number;
  returnType?: string;
  returnPolicy?: string;
}

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CustomerAddress {
  id?: string;
  customerId?: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  default: boolean;
}

export interface SellerProfile {
  id: string;
  userId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  contactInfo?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  razorpayAccountId?: string;
  accountHolderName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  pan?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  payoutStatus?: string;
}

export interface OrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice?: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURN_REQUESTED' | 'RETURNED';
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentInitiateResponse {
  paymentId?: string;
  orderId?: string;
  amount: number;
  razorpayOrderId: string;
  status?: string;
  key?: string;
  currency?: string;
}

// HookRelay Types
export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  rawKey?: string;
  createdAt: string;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  signingSecret: string;
  eventTypes: string[];
  isActive: boolean;
  createdAt: string;
}

export interface DeliveryLog {
  id: string;
  eventId: string;
  endpointId: string;
  endpointUrl: string;
  eventType: string;
  status: 'SUCCESS' | 'FAILED' | 'DEAD';
  httpStatus?: number;
  durationMs?: number;
  payload?: any;
  failureReason?: string;
  attempt?: number;
  timestamp?: string;
}

export interface DlqMessage {
  messageId: string;
  eventId: string;
  endpointId: string;
  endpointUrl: string;
  eventType: string;
  failureReason: string;
  payload: any;
  timestamp?: string;
}

export interface DashboardStats {
  totalEventsToday: number;
  successfulDeliveriesToday: number;
  failedDeliveriesToday: number;
  deadDeliveriesToday: number;
  dlqSize: number;
  successRatePercent: number;
}

// ==========================================
// 3. React Query Typed Hooks
// ==========================================

// --- ECOMMERCE AUTHENTICATION ---
export const useEcomLogin = (isSeller: boolean, options?: UseMutationOptions<AuthResponse, Error, any, any>) => {
  return useMutation<AuthResponse, Error, any, any>({
    mutationFn: async (credentials) => {
      const url = isSeller ? '/business/auth/login' : '/customer/auth/login';
      const res = await ecommerceApi.post<AuthResponse>(url, credentials);
      localStorage.setItem(isSeller ? 'seller_token' : 'storefront_token', res.data.token);
      return res.data;
    },
    ...options
  });
};

export const useEcomRegister = (isSeller: boolean, options?: UseMutationOptions<AuthResponse, Error, any, any>) => {
  return useMutation<AuthResponse, Error, any, any>({
    mutationFn: async (userData) => {
      const url = isSeller ? '/business/auth/register' : '/customer/auth/register';
      const res = await ecommerceApi.post<AuthResponse>(url, {
        ...userData,
        role: isSeller ? 'RETAILER' : 'CUSTOMER'
      });
      return res.data;
    },
    ...options
  });
};

// --- ECOMMERCE STOREFRONT PRODUCTS ---
export const usePublicProducts = (options?: any) => {
  return useQuery<Product[], Error>({
    queryKey: ['public-products'],
    queryFn: async () => {
      const res = await ecommerceApi.get<Product[]>('/public/products');
      return res.data;
    },
    ...options
  });
};

export const useSearchProducts = (query: string, options?: any) => {
  return useQuery<Product[], Error>({
    queryKey: ['search-products', query],
    queryFn: async () => {
      const res = await ecommerceApi.get<Product[]>(`/public/products/search?q=${query}`);
      return res.data;
    },
    enabled: !!query,
    ...options
  });
};

export const useProductDetail = (id: string, options?: any) => {
  return useQuery<Product, Error>({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await ecommerceApi.get<Product>(`/public/products/${id}`);
      return res.data;
    },
    enabled: !!id,
    ...options
  });
};

// --- ECOMMERCE CUSTOMER WISHLIST ---
export const useWishlist = (options?: any) => {
  return useQuery<Product[], Error>({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await ecommerceApi.get<Product[]>('/customer/wishlist');
      return res.data;
    },
    ...options
  });
};

export const useAddToWishlist = (options?: UseMutationOptions<void, Error, string, any>) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, any>({
    mutationFn: async (productId) => {
      await ecommerceApi.post('/customer/wishlist', null, {
        params: { productId }
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

export const useRemoveFromWishlist = (options?: UseMutationOptions<void, Error, string, any>) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, any>({
    mutationFn: async (productId) => {
      await ecommerceApi.delete(`/customer/wishlist/${productId}`);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

// --- ECOMMERCE CUSTOMER REVIEWS ---
export const useProductReviews = (productId: string, options?: any) => {
  return useQuery<Review[], Error>({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const res = await ecommerceApi.get<Review[]>(`/public/products/${productId}/reviews`);
      return res.data;
    },
    enabled: !!productId,
    ...options
  });
};

export const useSubmitProductReview = (productId: string, options?: UseMutationOptions<Review, Error, { rating: number; comment: string; customerName: string }, any>) => {
  const queryClient = useQueryClient();
  return useMutation<Review, Error, { rating: number; comment: string; customerName: string }, any>({
    mutationFn: async (payload) => {
      const res = await ecommerceApi.post<Review>(`/public/products/${productId}/reviews`, payload);
      return res.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

// --- ECOMMERCE CUSTOMER ADDRESSES ---
export const useAddresses = (options?: any) => {
  return useQuery<CustomerAddress[], Error>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await ecommerceApi.get<CustomerAddress[]>('/customer/addresses');
      return res.data;
    },
    ...options
  });
};

export const useSaveAddress = (options?: UseMutationOptions<CustomerAddress, Error, CustomerAddress, any>) => {
  const queryClient = useQueryClient();
  return useMutation<CustomerAddress, Error, CustomerAddress, any>({
    mutationFn: async (payload) => {
      const res = await ecommerceApi.post<CustomerAddress>('/customer/addresses', payload);
      return res.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

export const useDeleteAddress = (options?: UseMutationOptions<void, Error, string, any>) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, any>({
    mutationFn: async (id) => {
      await ecommerceApi.delete(`/customer/addresses/${id}`);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

// --- ECOMMERCE CUSTOMER COUPONS ---
export const useApplyCoupon = (options?: UseMutationOptions<{ code: string; discountPercent: number; valid: boolean }, Error, string, any>) => {
  return useMutation<{ code: string; discountPercent: number; valid: boolean }, Error, string, any>({
    mutationFn: async (code) => {
      const res = await ecommerceApi.post<{ code: string; discountPercent: number; valid: boolean }>('/customer/cart/apply-coupon', null, {
        params: { code }
      });
      return res.data;
    },
    ...options
  });
};

// --- ECOMMERCE CUSTOMER PROFILE ---
export interface CustomerProfile {
  id: string;
  email: string;
  name: string;
}

export const useProfile = (options?: any) => {
  return useQuery<CustomerProfile, Error>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await ecommerceApi.get<CustomerProfile>('/customer/profile');
      return res.data;
    },
    ...options
  });
};

export const useUpdateProfile = (options?: UseMutationOptions<{ token: string; email: string; name: string }, Error, { name?: string; email?: string; password?: string }, any>) => {
  const queryClient = useQueryClient();
  return useMutation<{ token: string; email: string; name: string }, Error, { name?: string; email?: string; password?: string }, any>({
    mutationFn: async (payload) => {
      const res = await ecommerceApi.put<{ token: string; email: string; name: string }>('/customer/profile', payload);
      return res.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

// --- ECOMMERCE SELLER PRODUCTS ---
export const useSellerProducts = (options?: any) => {
  return useQuery<Product[], Error>({
    queryKey: ['seller-products'],
    queryFn: async () => {
      const res = await ecommerceApi.get<Product[]>('/business/products/mine');
      return res.data;
    },
    ...options
  });
};

export const useCreateProduct = (options?: UseMutationOptions<Product, Error, Omit<Product, 'id' | 'retailerId' | 'active'>, any>) => {
  const queryClient = useQueryClient();
  return useMutation<Product, Error, Omit<Product, 'id' | 'retailerId' | 'active'>, any>({
    mutationFn: async (productData) => {
      const res = await ecommerceApi.post<Product>('/business/products', productData);
      return res.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['public-products'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

export const useUpdateStock = (options?: UseMutationOptions<Product, Error, { id: string; quantity: number }, any>) => {
  const queryClient = useQueryClient();
  return useMutation<Product, Error, { id: string; quantity: number }, any>({
    mutationFn: async ({ id, quantity }) => {
      const res = await ecommerceApi.put<Product>(`/business/products/${id}/stock?stockQuantity=${quantity}`);
      return res.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

export const useUpdateProduct = (options?: UseMutationOptions<Product, Error, { id: string; productData: Omit<Product, 'id' | 'retailerId' | 'active'> }, any>) => {
  const queryClient = useQueryClient();
  return useMutation<Product, Error, { id: string; productData: Omit<Product, 'id' | 'retailerId' | 'active'> }, any>({
    mutationFn: async ({ id, productData }) => {
      const res = await ecommerceApi.put<Product>(`/business/products/${id}`, productData);
      return res.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['public-products'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

export const useDeleteProduct = (options?: UseMutationOptions<void, Error, string, any>) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, any>({
    mutationFn: async (id) => {
      await ecommerceApi.delete(`/business/products/${id}`);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables] });
      queryClient.invalidateQueries({ queryKey: ['public-products'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

// --- ECOMMERCE CUSTOMER ORDERS ---
export const useCustomerOrders = (options?: any) => {
  return useQuery<Order[], Error>({
    queryKey: ['customer-orders'],
    queryFn: async () => {
      const res = await ecommerceApi.get<Order[]>('/customer/orders');
      return res.data;
    },
    ...options
  });
};

export const usePlaceOrder = (options?: UseMutationOptions<Order, Error, { items: { productId: string; quantity: number }[]; coupon?: string }, any>) => {
  const queryClient = useQueryClient();
  return useMutation<Order, Error, { items: { productId: string; quantity: number }[]; coupon?: string }, any>({
    mutationFn: async (orderPayload) => {
      const res = await ecommerceApi.post<Order>('/customer/orders', orderPayload);
      return res.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

export const useOrderDetail = (orderId: string, options?: any) => {
  return useQuery<Order, Error>({
    queryKey: ['order-detail', orderId],
    queryFn: async () => {
      const res = await ecommerceApi.get<Order>(`/customer/orders/${orderId}`);
      return res.data;
    },
    enabled: !!orderId,
    ...options
  });
};

export const useCancelOrder = (options?: UseMutationOptions<void, Error, { id: string; reason?: string }, any>) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; reason?: string }, any>({
    mutationFn: async ({ id, reason }) => {
      await ecommerceApi.patch(`/customer/orders/${id}/cancel`, null, {
        params: reason ? { reason } : undefined
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-detail', variables.id] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

export const useReturnOrder = (options?: UseMutationOptions<void, Error, { id: string; reason?: string }, any>) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; reason?: string }, any>({
    mutationFn: async ({ id, reason }) => {
      await ecommerceApi.post(`/customer/orders/${id}/return`, null, {
        params: reason ? { reason } : undefined
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-detail', variables.id] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

// --- ECOMMERCE SELLER ORDERS ---
export const useIncomingOrders = (options?: any) => {
  return useQuery<Order[], Error>({
    queryKey: ['seller-orders'],
    queryFn: async () => {
      const res = await ecommerceApi.get<Order[]>('/business/orders/incoming');
      return res.data;
    },
    ...options
  });
};

export const useShipOrder = (options?: UseMutationOptions<Order, Error, string, any>) => {
  const queryClient = useQueryClient();
  return useMutation<Order, Error, string, any>({
    mutationFn: async (orderId) => {
      const res = await ecommerceApi.put<Order>(`/business/orders/${orderId}/ship`);
      return res.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

// --- ECOMMERCE SELLER PROFILE ---
export const useSellerProfile = (options?: any) => {
  return useQuery<SellerProfile, Error>({
    queryKey: ['seller-profile'],
    queryFn: async () => {
      const res = await ecommerceApi.get<SellerProfile>('/business/profile');
      return res.data;
    },
    ...options
  });
};

export const useUpdateSellerProfile = (options?: UseMutationOptions<SellerProfile, Error, Omit<SellerProfile, 'id' | 'userId'>, any>) => {
  const queryClient = useQueryClient();
  return useMutation<SellerProfile, Error, Omit<SellerProfile, 'id' | 'userId'>, any>({
    mutationFn: async (profileData) => {
      const res = await ecommerceApi.put<SellerProfile>('/business/profile', profileData);
      return res.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

export const useSetupPayoutAccount = (options?: UseMutationOptions<SellerProfile, Error, { sellerId: string; accountData: any }, any>) => {
  const queryClient = useQueryClient();
  return useMutation<SellerProfile, Error, { sellerId: string; accountData: any }, any>({
    mutationFn: async ({ sellerId, accountData }) => {
      const res = await ecommerceApi.post<SellerProfile>(`/business/sellers/${sellerId}/payout-account`, accountData);
      return res.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

// --- ECOMMERCE PAYMENTS ---
export const useInitiatePayment = (options?: UseMutationOptions<PaymentInitiateResponse, Error, { orderId: string; amount: number }, any>) => {
  return useMutation<PaymentInitiateResponse, Error, { orderId: string; amount: number }, any>({
    mutationFn: async (payload) => {
      const res = await ecommerceApi.post<PaymentInitiateResponse>('/customer/payments/initiate', payload);
      return res.data;
    },
    ...options
  });
};

export const useVerifyPayment = (options?: UseMutationOptions<any, Error, { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }, any>) => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }, any>({
    mutationFn: async (payload) => {
      const res = await ecommerceApi.post('/customer/payments/verify', payload);
      return res.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

// ==========================================
// 4. HookRelay Platform API Hooks
// ==========================================

// --- HOOKRELAY AUTH ---
export const useHookRelayLogin = (options?: UseMutationOptions<AuthResponse, Error, any, any>) => {
  return useMutation<AuthResponse, Error, any, any>({
    mutationFn: async (credentials) => {
      const res = await hookRelayApi.post<AuthResponse>('/api/auth/login', credentials);
      localStorage.setItem('hookrelay_token', res.data.token);
      return res.data;
    },
    ...options
  });
};

export const useHookRelayRegister = (options?: UseMutationOptions<any, Error, any, any>) => {
  return useMutation<any, Error, any, any>({
    mutationFn: async (userData) => {
      const res = await hookRelayApi.post('/api/auth/register', userData);
      return res.data;
    },
    ...options
  });
};

// --- HOOKRELAY API KEYS ---
export const useApiKeys = (options?: any) => {
  return useQuery<ApiKey[], Error>({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await hookRelayApi.get<ApiKey[]>('/api/keys');
      return res.data;
    },
    ...options
  });
};

export const useCreateApiKey = (options?: UseMutationOptions<ApiKey, Error, { name: string }, any>) => {
  const queryClient = useQueryClient();
  return useMutation<ApiKey, Error, { name: string }, any>({
    mutationFn: async (payload) => {
      const res = await hookRelayApi.post<ApiKey>('/api/keys', payload);
      return res.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

// --- HOOKRELAY ENDPOINTS ---
export const useEndpoints = (options?: any) => {
  return useQuery<WebhookEndpoint[], Error>({
    queryKey: ['endpoints'],
    queryFn: async () => {
      const res = await hookRelayApi.get<WebhookEndpoint[]>('/api/endpoints');
      return res.data;
    },
    ...options
  });
};

export const useCreateEndpoint = (options?: UseMutationOptions<WebhookEndpoint, Error, Omit<WebhookEndpoint, 'id' | 'signingSecret' | 'isActive' | 'createdAt'>, any>) => {
  const queryClient = useQueryClient();
  return useMutation<WebhookEndpoint, Error, Omit<WebhookEndpoint, 'id' | 'signingSecret' | 'isActive' | 'createdAt'>, any>({
    mutationFn: async (endpointData) => {
      const res = await hookRelayApi.post<WebhookEndpoint>('/api/endpoints', endpointData);
      return res.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

export const useDeactivateEndpoint = (options?: UseMutationOptions<void, Error, string, any>) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, any>({
    mutationFn: async (endpointId) => {
      await hookRelayApi.delete(`/api/endpoints/${endpointId}`);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

// --- HOOKRELAY DASHBOARD & LOGS ---
export const useDashboardStats = (options?: any) => {
  return useQuery<DashboardStats, Error>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await hookRelayApi.get<DashboardStats>('/api/dashboard/stats');
      return res.data;
    },
    refetchInterval: 5000, // Live poll every 5 seconds
    ...options
  });
};

export const useEventDeliveries = (eventId: string, options?: any) => {
  return useQuery<DeliveryLog[], Error>({
    queryKey: ['event-deliveries', eventId],
    queryFn: async () => {
      const res = await hookRelayApi.get<DeliveryLog[]>(`/api/dashboard/events/${eventId}/deliveries`);
      return res.data;
    },
    enabled: !!eventId,
    ...options
  });
};

export const useEndpointDeliveries = (endpointId: string, status?: string, options?: any) => {
  return useQuery<DeliveryLog[], Error>({
    queryKey: ['endpoint-deliveries', endpointId, status],
    queryFn: async () => {
      const url = status 
        ? `/api/dashboard/endpoints/${endpointId}/deliveries?status=${status}`
        : `/api/dashboard/endpoints/${endpointId}/deliveries`;
      const res = await hookRelayApi.get<DeliveryLog[]>(url);
      return res.data;
    },
    enabled: !!endpointId,
    ...options
  });
};

export const useDlqMessages = (options?: any) => {
  return useQuery<DlqMessage[], Error>({
    queryKey: ['dlq-messages'],
    queryFn: async () => {
      const res = await hookRelayApi.get<DlqMessage[]>('/api/dashboard/dlq');
      return res.data;
    },
    ...options
  });
};

export const useReplayDlq = (options?: UseMutationOptions<any, Error, string, any>) => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string, any>({
    mutationFn: async (messageId) => {
      const res = await hookRelayApi.post(`/api/dashboard/dlq/${messageId}/replay`);
      return res.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['dlq-messages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

// --- ECOMMERCE SELLER COUPONS ---
export interface Coupon {
  id?: string;
  code: string;
  discountPercent: number;
  retailerId?: string;
}

export const useSellerCoupons = (options?: any) => {
  return useQuery<Coupon[], Error>({
    queryKey: ['seller-coupons'],
    queryFn: async () => {
      const res = await ecommerceApi.get<Coupon[]>('/business/coupons');
      return res.data;
    },
    ...options
  });
};

export const useCreateCoupon = (options?: UseMutationOptions<Coupon, Error, Omit<Coupon, 'id' | 'retailerId'>, any>) => {
  const queryClient = useQueryClient();
  return useMutation<Coupon, Error, Omit<Coupon, 'id' | 'retailerId'>, any>({
    mutationFn: async (payload) => {
      const res = await ecommerceApi.post<Coupon>('/business/coupons', payload);
      return res.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['seller-coupons'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

export const useDeleteCoupon = (options?: UseMutationOptions<void, Error, string, any>) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, any>({
    mutationFn: async (id) => {
      await ecommerceApi.delete(`/business/coupons/${id}`);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['seller-coupons'] });
      if (options?.onSuccess) (options.onSuccess as any)(data, variables, context);
    },
    ...options
  });
};

export const formatImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }
  return url;
};
