import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap, catchError, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = 'http://localhost:9003/invoice/api/invoice';

  constructor(private http: HttpClient) { }

  generateAndDownloadInvoice(orderId: number): Observable<Blob> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // First try to download the invoice
    return this.downloadInvoice(orderId).pipe(
      // If download fails (404), generate new invoice
      catchError(error => {
        if (error.status === 404) {
          console.log('Invoice not found, generating new one...');
          // Generate new invoice
          return this.http.post(`${this.apiUrl}/generate/${orderId}`, {}, { 
            headers,
            responseType: 'text'
          }).pipe(
            // After successful generation, download the invoice
            switchMap(() => this.downloadInvoice(orderId))
          );
        }
        throw error;
      }),
      tap(response => console.log('Invoice download response:', response)),
      catchError(error => {
        console.error('Invoice generation/download error:', error);
        let errorMessage = 'Failed to generate/download invoice';
        
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error.error) {
            errorMessage = error.error.error;
          }
        }
        
        if (error.status === 0) {
          errorMessage = 'Cannot connect to invoice service. Please check if the service is running at http://localhost:9003';
        } else if (error.status === 404) {
          errorMessage = 'Invoice service endpoint not found. Please check if the service is running correctly.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid request data. Please check all required fields are filled correctly.';
        } else if (error.status === 500) {
          errorMessage = 'Server error occurred while generating invoice. Please try again later.';
        }
        
        throw new Error(errorMessage);
      })
    );
  }

  private downloadInvoice(orderId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${orderId}`, {
      responseType: 'blob'
    });
  }
} 