// src/app/client.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Client } from './client.model';
import { ToastrService } from 'ngx-toastr';

export interface PaginatedResponse<T> {
  content: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {

   // URL to your Spring backend
private apiUrl = 'http://localhost:9001/pos/api/clients'; 
  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  getAllClients(page: number = 0, size: number = 10): Observable<PaginatedResponse<Client>> {
    return this.http.get<PaginatedResponse<Client>>(`${this.apiUrl}/get?page=${page}&size=${size}`).pipe(
      catchError(error => {
        console.error('Error fetching clients:', error);
        this.toastr.error('Failed to fetch clients', 'Error');
        return throwError(() => error);
      })
    );
  }

  getClientByName(name: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/search/${name}`).pipe(
      catchError(error => {
        console.error(`Error fetching client ${name}:`, error);
        this.toastr.error(`Failed to fetch client ${name}`, 'Error');
        return throwError(() => error);
      })
    );
  }

  addClient(client: Client): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, client).pipe(
      tap(() => {
        this.toastr.success(`Client ${client.clientName} added successfully`, 'Client Added');
      }),
      catchError(error => {
        console.error('Error adding client:', error);
        if (error.status === 400) {
          this.toastr.error(`Client '${client.clientName}' already exists`, 'Error');
        } else if (error.error && error.error.message) {
          this.toastr.error(error.error.message, 'Error');
        } else {
          this.toastr.error('An unknown error occurred while adding the client', 'Error');
        }
        return throwError(() => error);
      })
    );
  }

  updateClient(originalName: string, updatedClient: Client): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${originalName}`, updatedClient).pipe(
      tap(() => {
        this.toastr.success(`Client ${updatedClient.clientName} updated successfully`, 'Client Updated');
      }),
      catchError(error => {
        console.error('Error updating client:', error);
        if (error.error && error.error.message) {
          if (error.error.message.includes('Duplicate') || error.error.message.includes('already exists')) {
            this.toastr.error(`Client name ${updatedClient.clientName} already exists`, 'Duplicate Client');
          } else {
            this.toastr.error(error.error.message, 'Failed to Update Client');
          }
        } else {
          this.toastr.error('An unknown error occurred while updating the client', 'Error');
        }
        return throwError(() => error);
      })
    );
  }
  
  searchClients(query: string, page: number = 0, size: number = 10): Observable<PaginatedResponse<Client>> {
    console.log('Calling search API with term:', query);
    return this.http.get<PaginatedResponse<Client>>(`${this.apiUrl}/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`).pipe(
      catchError(error => {
        console.error('Error searching clients:', error);
        this.toastr.error('Failed to search clients', 'Error');
        return throwError(() => error);
      })
    );
  }
}
