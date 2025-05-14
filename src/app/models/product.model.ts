export interface Product {
  id?: number;
  barcode: string;
  name: string;
  mrp: number;
  clientName: string;
  imageUrl?: string;
  quantity?: number;
  client?: {
    id: number;
    name: string;
  };
}

export interface ProductForm {
  barcode: string;
  name: string;
  mrp: number;
  clientName: string;
  imageUrl?: string;
} 