// src/app/product.model.ts

export interface Product {
    id?: number;         // Optional field for product ID
    name: string;        // Product name
    barcode: string;     // Product barcode
    mrp: number;         // Maximum retail price
    clientName: string;  // Client name
    imageUrl: string;    // Product image URL
    quantity?: number;   // Optional field for product quantity
}

// Form interface for creating/updating products
export interface ProductForm {
    barcode: string;
    clientName: string;
    name: string;
    mrp: number;
    imageUrl: string;
}
  