import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClientService } from '../../client.service';
import { ProductService } from '../../product.service';
import { OrderService } from '../../order.service';
import { RevenueService } from '../../services/revenue.service';
import { PaginatedResponse } from '../../models/paginated-response.model';
import { Client } from '../../client.model';
import { Product } from '../../product.model';
import { Order } from '../../order.model';
import { TopClientsComponent } from '../../components/top-clients/top-clients.component';
import { RevenueChartsComponent } from '../../components/revenue-charts/revenue-charts.component';
import { RevenueData } from '../../models/revenue.model';
import { HasRoleDirective } from '../../directives/has-role.directive';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TopClientsComponent,
    RevenueChartsComponent,
    HasRoleDirective
  ]
})
export class DashboardComponent implements OnInit {
  stats = {
    clients: 0,
    products: 0,
    orders: 0,
    revenue: 0
  };
  isLoading = false;
  error: string | null = null;

  constructor(
    private clientService: ClientService,
    private productService: ProductService,
    private orderService: OrderService,
    private revenueService: RevenueService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.error = null;

    // Get total number of clients
    this.clientService.getAllClients(0, 1).subscribe({
      next: (response: PaginatedResponse<Client>) => {
        this.stats.clients = response.totalItems;
      },
      error: (err) => {
        this.error = 'Failed to load client stats';
        console.error('Error loading client stats:', err);
      }
    });

    // Get total number of products
    this.productService.getAllProducts(0, 1).subscribe({
      next: (response: PaginatedResponse<Product>) => {
        this.stats.products = response.totalItems;
      },
      error: (err) => {
        this.error = 'Failed to load product stats';
        console.error('Error loading product stats:', err);
      }
    });

    // Get total number of orders
    this.orderService.getAllOrders(0, 1).subscribe({
      next: (response: PaginatedResponse<Order>) => {
        this.stats.orders = response.totalItems;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load order stats';
        console.error('Error loading order stats:', err);
        this.isLoading = false;
      }
    });

    // Get revenue from revenue service
    this.revenueService.getMonthlyRevenue().subscribe({
      next: (data: RevenueData[]) => {
        this.stats.revenue = data.reduce((total, item) => total + item.revenue, 0);
      },
      error: (err) => {
        this.error = 'Failed to load revenue stats';
        console.error('Error loading revenue stats:', err);
      }
    });
  }

  refreshData(): void {
    this.loadStats();
  }
}
