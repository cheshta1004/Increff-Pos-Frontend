import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Order } from './order.model';
import { ToastrService } from 'ngx-toastr';
import { PaginatedResponse } from './models/paginated-response.model';

export interface BulkOrderItemForm {
    orderItems: Array<{
        barcode: string;
        quantity: number;
        sellingPrice: number;
    }>;
    customerName: string;
    customerContact: string;
}

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private apiUrl = 'http://localhost:9001/pos/api/order';
    
    constructor(
        private http: HttpClient,
        private toastr: ToastrService
    ) {}

    getAllOrders(page: number = 0, size: number = 10): Observable<PaginatedResponse<Order>> {
        return this.http.get<PaginatedResponse<Order>>(`${this.apiUrl}/get?page=${page}&size=${size}`);
    }
    
    placeOrder(form: BulkOrderItemForm): Observable<any> {
        return this.http.post(`${this.apiUrl}/place-bulk`, form).pipe(
            map((response: any) => {
                if (response && typeof response === 'object') {
                    // The backend returns orderId, so we map it to both id and orderId
                    return {
                        ...response,
                        id: response.orderId,
                        orderId: response.orderId
                    };
                }
                return response;
            }),
            catchError(error => {
                console.error('Error placing order:', error);
                
                // Check for specific error messages
                if (error.error && error.error.message) {
                    const errorMsg = error.error.message;
                    
                    // Check for constraint violation error (duplicate product in order)
                    if (errorMsg.includes('ConstraintViolationException') || 
                        errorMsg.includes('could not execute statement')) {
                        this.toastr.error('Order not created: The same product cannot be added multiple times to an order', 'Order Failed');
                    } else {
                        this.toastr.error(`Order not created: ${errorMsg}`, 'Order Failed');
                    }
                } else {
                    this.toastr.error('Order not created: An unknown error occurred', 'Order Failed');
                }
                
                return throwError(() => error);
            })
        );
    }

    completeOrder(orderId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/complete/${orderId}`, null).pipe(
            catchError(error => {
                console.error('Error completing order:', error);
                this.toastr.error('Failed to complete order', 'Error');
                return throwError(() => error);
            })
        );
    }

    updateOrderStatus(orderId: number, status: 'COMPLETED' | 'CANCELLED'): Observable<any> {
        return this.http.put(`${this.apiUrl}/update-status/${orderId}/${status}`, {});
    }
}