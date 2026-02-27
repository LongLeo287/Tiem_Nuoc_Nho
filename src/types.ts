export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isOutOfStock?: boolean;
  hasCustomizations?: boolean;
}

export interface CartItem extends MenuItem {
  cartItemId: string;
  quantity: number;
  size: string;
  toppings: string[];
  unitPrice: number;
  temperature?: string;
  sugarLevel?: string;
  iceLevel?: string;
  note?: string;
}

export interface OrderData {
  orderId: string;
  customerName: string;
  tableNumber: string;
  items: CartItem[];
  total: number;
  timestamp: string;
  notes?: string;
}
