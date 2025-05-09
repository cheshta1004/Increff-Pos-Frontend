import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface InventoryForm {
  productBarcode: string;
  quantity: number;
}

export interface BulkInventoryData {
  successList: Array<{
    data: InventoryForm;
    message: string;
  }>;
  failureList: Array<{
    data: InventoryForm;
    message: string;
  }>;
}

export interface InventoryError {
  message: string;
  status: number;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = 'http://localhost:9001/pos/api/inventory';

  constructor(private http: HttpClient) {}

  getQuantityByBarcode(barcode: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/get/${barcode}`).pipe(
      catchError(this.handleError)
    );
  }
  
  updateInventory(barcode: string, quantity: number): Observable<any> {
    const form: InventoryForm = {
      productBarcode: barcode,
      quantity: quantity
    };
    return this.http.put(`${this.apiUrl}/update/${barcode}`, form).pipe(
      catchError(this.handleError)
    );
  }
  
  addInventory(form: InventoryForm): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/add`, form).pipe(
      catchError(this.handleError)
    );
  }
  
  addInventoryList(formList: InventoryForm[]): Observable<BulkInventoryData> {
    return this.http.put<BulkInventoryData>(`${this.apiUrl}/updateList`, formList).pipe(
      catchError(this.handleError)
    );
  }
  
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred while processing your request.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 400) {
        errorMessage = error.error?.message || 'Invalid request. Please check your input.';
      } else if (error.status === 404) {
        errorMessage = 'The requested resource was not found.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.error?.message || `Server returned code ${error.status}`;
      }
    }
    
    console.error('Inventory service error:', error);
    return throwError(() => new Error(errorMessage));
  }
} 

