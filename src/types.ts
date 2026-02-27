export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isOutOfStock?: boolean;
  hasCustomizations?: boolean;
  variants?: {
    [key: string]: {
      id: string;
      price: number;
    };
  };
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
  paymentMethod: 'Tiền mặt' | 'Chuyển khoản';
  orderStatus: 'Đã nhận' | 'Đang làm' | 'Hoàn thành' | 'Đã hủy';
  paymentStatus: 'Chưa thanh toán' | 'Đã thanh toán';
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  timestamp: string;
}
