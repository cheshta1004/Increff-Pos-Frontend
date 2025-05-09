export interface Product {
  id?: number;
  barcode: string;
  name: string;
  mrp: number;
  clientName: string;
  imageUrl?: string;
  quantity?: number;
}

export interface ProductForm {
  barcode: string;
  name: string;
  mrp: number;
  clientName: string;
  imageUrl?: string;
} 