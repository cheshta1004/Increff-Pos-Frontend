export interface Order {
  id?: number;
  orderId?: number;
  time: number;
  status: string;
  items: OrderItem[];
  customerName: string;
  customerContact: string;
  customerAddress: string;
}

export interface OrderItem {
  id?: number;
  barcode: string;
  quantity: number;
  sellingPrice: number;
}

export interface InvoiceInfo {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerContact: string;
  customerAddress: string;
  items: OrderItem[];
  totalAmount: number;
} 