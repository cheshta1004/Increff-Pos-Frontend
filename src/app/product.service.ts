import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Product, ProductForm } from './product.model';
import { ToastrService } from 'ngx-toastr';
import { PaginatedResponse } from './models/paginated-response.model';

interface OperationResponse<T> {
  data: T;
  message: string;
}

interface ProductInsertResult {
  successList: OperationResponse<Product>[];
  failureList: OperationResponse<Product>[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = 'http://localhost:9001/pos/api/product';  // URL to your Spring backend

  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  // Get all products from backend
  getAllProducts(page: number = 0, size: number = 50): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}/get?page=${page}&size=${size}`);
  }

  // Get a product by its barcode
  getProductByBarcode(barcode: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/barcode/${barcode}`).pipe(
      catchError(error => {
        console.error(`Error fetching product with barcode ${barcode}:`, error);
        this.toastr.error(`Failed to fetch product with barcode ${barcode}`, 'Error');
        return throwError(() => error);
      })
    );
  }

  // Get products by client name
  getProductsByClientName(clientName: string, page: number = 0, size: number = 10): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}/search?clientName=${encodeURIComponent(clientName)}&page=${page}&size=${size}`);
  }

  // Get products by partial barcode
  getProductsByPartialBarcode(barcode: string, page: number = 0, size: number = 10): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}/search?barcode=${encodeURIComponent(barcode)}&page=${page}&size=${size}`);
  }

  // Add a new product
  addProduct(product: ProductForm): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, product).pipe(
      tap(() => {
        this.toastr.success(`Successfully added product ${product.name} (${product.barcode})`, 'Product Added');
      }),
      catchError(error => {
        console.error('Error adding product:', error);
        if (error.error) {
          this.toastr.error(error.error, 'Failed to Add Product');
          return throwError(() => ({ error: { message: error.error } }));
        } else {
          this.toastr.error('An unknown error occurred while adding the product', 'Error');
          return throwError(() => ({ error: { message: 'An unknown error occurred while adding the product' } }));
        }
      })
    );
  }

  // Update an existing product
  updateProduct(product: ProductForm): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${product.barcode}`, product).pipe(
      tap(() => {
        this.toastr.success(`Product ${product.name} (${product.barcode}) updated successfully`, 'Product Updated');
      }),
      catchError(error => {
        console.error('Error updating product:', error);
        if (error.error && error.error.message) {
          this.toastr.error(error.error.message, 'Failed to Update Product');
        } else {
          this.toastr.error('An unknown error occurred while updating the product', 'Error');
        }
        return throwError(() => error);
      })
    );
  }

  // Import multiple products
  importProducts(products: ProductForm[]): Observable<ProductInsertResult> {
    return this.http.post<ProductInsertResult>(`${this.apiUrl}/add-list`, products).pipe(
      tap(response => {
        if (response.failureList && response.failureList.length > 0) {
          response.failureList.forEach(failure => {
            this.toastr.error(failure.message, 'Import Error');
          });
        }
        const successCount = response.successList ? response.successList.length : 0;
        if (successCount > 0) {
          this.toastr.success(`Successfully imported ${successCount} products`, 'Import Complete');
        }
      }),
      catchError(error => {
        console.error('Error importing products:', error);
        if (error.error && error.error.message) {
          this.toastr.error(error.error.message, 'Import Failed');
        } else {
          this.toastr.error('An unknown error occurred while importing products', 'Error');
        }
        return throwError(() => error);
      })
    );
  }

  // Search products for order creation
  searchProductsForOrder(searchTerm: string): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(
      `${this.apiUrl}/search?searchTerm=${encodeURIComponent(searchTerm)}&page=0&size=10`
    );
  }
}
