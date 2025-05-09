export interface InvoiceItemPojo {
    productName: string;
    quantity: number;  // Will be converted to Integer in backend
    sellingPrice: number;  // Will be converted to Double in backend
    totalPrice: number;  // Will be converted to Double in backend
} 