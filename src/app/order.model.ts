export interface Order {
    id?: number;
    orderId?: number;
    time?: number;
    status: 'CREATED' | 'COMPLETED' ;
    items: OrderItem[];
    customerName: string;
    customerContact: string;
    customerAddress?: string;
}

export interface OrderItem {
    barcode: string;
    quantity: number;
    sellingPrice: number;
    productName?: string;
}

export interface InvoiceInfo {
    customerName: string;
    customerContact: string;
    customerAddress?: string;
}
