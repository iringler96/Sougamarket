export type UserRole = 'ADMIN' | 'CUSTOMER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  brand?: string | null;
  price: number;
  offerPrice?: number | null;
  offerEnabled: boolean;
  stock: number;
  lowStockThreshold: number;
  imageUrl?: string | null;
  active: boolean;
  requiresAgeCheck: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  originalPrice?: number | null;
  product: Product;
}

export interface Order {
  id: number;
  code: string;
  total: number;
  shippingAddress: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  user?: User;
  items: OrderItem[];
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardData {
  totalSales: number;
  orderCount: number;
  averageTicket: number;
  productCount: number;
  lowStockProducts: Product[];
  topProducts: Array<{
    productId: number;
    name: string;
    units: number;
    revenue: number;
  }>;
  recentOrders: Order[];
  notifications: NotificationItem[];
}