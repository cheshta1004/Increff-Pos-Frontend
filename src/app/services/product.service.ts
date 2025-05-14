import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../models/paginated-response.model';
import { Product } from '../models/product.model';
import { ProductForm } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8080/api/products';

  constructor(private http: HttpClient) {}

  getAllProducts(page: number, size: number): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  getProductsByPartialName(name: string, page: number, size: number): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}/search/name?name=${name}&page=${page}&size=${size}`);
  }

  getProductsByPartialBarcode(barcode: string, page: number, size: number): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}/search/barcode?barcode=${barcode}&page=${page}&size=${size}`);
  }

  getProductsByClientName(clientName: string, page: number, size: number): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}/search/client?clientName=${clientName}&page=${page}&size=${size}`);
  }

  addProduct(product: ProductForm): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(product: ProductForm): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${product.barcode}`, product);
  }

  importProducts(products: ProductForm[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/import`, products);
  }
} 