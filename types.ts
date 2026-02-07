
export type Category = 'بيتزا' | 'كريب' | 'سندوتشات' | 'إضافات';
export type OrderType = 'صالة' | 'تيك أواي' | 'توصيل';
export type PizzaSize = 'S' | 'M' | 'L';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';

export interface Product {
  id: string;
  name: string;
  category: Category;
  prices: {
    base?: number;
    S?: number;
    M?: number;
    L?: number;
    roll?: number;
    triangle?: number;
  };
  ingredients?: { materialId: string; amount: number }[];
}

export interface Topping {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  size?: PizzaSize | string;
  basePrice: number;
  toppings: Topping[];
  quantity: number;
  totalPrice: number;
  isStuffedCrust?: boolean;
  stuffedCrustPrice?: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFees: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: 'cash' | 'visa';
  status: OrderStatus;
  timestamp: string; // ISO string for persistence
  cashier: string;
  note?: string;
  customerId?: string;
  orderType: OrderType;
  isUrgent?: boolean;
  preparationTime?: number; // minutes
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  minLimit: number;
}

export interface User {
  username: string;
  password?: string;
  role: 'admin' | 'cashier' | 'supervisor';
  name: string;
  performanceScore: number;
  joinedAt: string;
  salary: number;
  isPresent?: boolean;
  delaysCount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  points: number;
  notes: string;
  ordersCount: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

export enum SoundType {
  CLICK = 'click',
  SUCCESS = 'success',
  ERROR = 'error',
  ADD = 'add'
}
