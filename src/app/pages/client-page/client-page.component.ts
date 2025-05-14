// src/app/client-page/client-page.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ClientService, PaginatedResponse } from '../../client.service';  
import { Client } from '../../client.model';  
import { HasRoleDirective } from '../../directives/has-role.directive';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-client-page',
  templateUrl: './client-page.component.html',
  styleUrls: ['./client-page.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, HasRoleDirective],
  providers: [ClientService]
})
export class ClientPageComponent implements OnInit {

  clients: Client[] = [];  // List to hold clients
  newClient: Client = { clientName: ''};  // New client object for adding
  editClient: Client = { clientName: '' };
  originalClientName: string = '';
  showAddModal = false;
  showEditModal = false;
  errorMessage = '';
  searchTerm = '';
  searchError: string | null = null;
  isSearching: boolean = false;
  isSearchActive = false;
  allClients: Client[] = [];  // Store all clients
  filteredClients: Client[] = [];  // Store filtered clients

  // Pagination properties
  currentPage: number = 0;
  itemsPerPage = 20; // Increased from default to show more cards per page
  totalPages: number = 0;
  totalItems: number = 0;

  constructor(
    private clientService: ClientService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    if (this.isSearchActive && this.searchTerm) {
      this.searchClients();
    } else {
      this.getAllClients();
    }
  }

  getAllClients(): void {
    this.clientService.getAllClients(this.currentPage, this.itemsPerPage).subscribe({
      next: (response: PaginatedResponse<Client>) => {
        this.clients = response.content;
        this.totalPages = response.totalPages;
        this.totalItems = response.totalItems;
        this.itemsPerPage = response.pageSize;
      },
      error: (error) => {
        console.error('Error fetching clients:', error);
        this.errorMessage = 'Failed to fetch clients. Please try again.';
      }
    });
  }

  searchClients(): void {
    if (!this.searchTerm.trim()) {
      this.isSearchActive = false;
      this.getAllClients();
      return;
    }

    this.isSearchActive = true;
    this.clientService.searchClients(this.searchTerm, this.currentPage, this.itemsPerPage).subscribe({
      next: (response: PaginatedResponse<Client>) => {
        this.clients = response.content;
        this.totalPages = response.totalPages;
        this.totalItems = response.totalItems;
        this.itemsPerPage = response.pageSize;
      },
      error: (error) => {
        console.error('Error searching clients:', error);
        this.searchError = 'Failed to search clients. Please try again.';
      }
    });
  }

  openAddClientModal(): void {
    this.showAddModal = true;
    this.newClient = { clientName: ''};
    this.errorMessage = '';
  }

  closeAddClientModal(): void {
    this.showAddModal = false;
    this.errorMessage = '';
  }

  openEditClientModal(client: Client): void {
    this.editClient = { ...client };
    this.originalClientName = client.clientName; 
    this.showEditModal = true;
    this.errorMessage = '';
  }

  closeEditClientModal(): void {
    this.showEditModal = false;
    this.errorMessage = '';
  }

  submitNewClient(): void {
    if (!this.newClient.clientName.trim()) {
      this.errorMessage = 'Client name cannot be empty';
      return;
    }

    this.clientService.addClient(this.newClient).subscribe({
      next: () => {
        this.getAllClients();
        this.closeAddClientModal();
    
      },
      error: (error) => {
        console.error('Error adding client:', error);
        if (error.status === 400) {
          this.errorMessage = `Client '${this.newClient.clientName}' already exists`;
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Failed to add client. Please try again.';
        }
      }
    });
  }

  submitEditClient(): void {
    if (!this.editClient.clientName.trim()) {
      this.errorMessage = 'Client name cannot be empty';
      return;
    }
  
    this.clientService.updateClient(this.originalClientName, this.editClient).subscribe({
      next: () => {
        this.getAllClients();
        this.closeEditClientModal();
      },
      error: (error) => {
        console.error('Error updating client:', error);
        this.errorMessage = 'Failed to update client. Please try again.';
      }
    });
  }

  onSearchInput(): void {
    this.currentPage = 0; // Reset to first page when searching
    this.searchClients();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadClients();
  }

  private showToast(type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) {
    switch (type) {
      case 'success':
        this.toastr.success(message, title);
        break;
      case 'error':
        this.toastr.error(message, title);
        break;
      case 'info':
        this.toastr.info(message, title);
        break;
      case 'warning':
        this.toastr.warning(message, title);
        break;
    }
  }

}
  