import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RevenueService, SalesReportFilter } from '../../services/revenue.service';
import { RevenueData } from '../../models/revenue.model';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-report.component.html',
  styleUrls: ['./sales-report.component.css']
})
export class SalesReportComponent implements OnInit {
  revenueData: RevenueData[] = [];
  isLoading = false;
  error: string | null = null;
  totalRevenue = 0;
  totalQuantity = 0;

  // Filter properties
  filter: SalesReportFilter = {
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    clientName: ''
  };

  constructor(private revenueService: RevenueService) {}

  ngOnInit(): void {
    this.loadRevenueData();
  }

  loadRevenueData(): void {
    this.isLoading = true;
    this.error = null;

    this.revenueService.getFilteredSalesReport(this.filter).subscribe({
      next: (data) => {
        this.revenueData = data;
        this.calculateTotals();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load revenue data';
        console.error('Error loading revenue data:', err);
        this.isLoading = false;
      }
    });
  }

  private calculateTotals(): void {
    this.totalRevenue = this.revenueData.reduce((sum, item) => sum + item.revenue, 0);
    this.totalQuantity = this.revenueData.reduce((sum, item) => sum + item.quantity, 0);
  }

  refreshData(): void {
    this.loadRevenueData();
  }

  clearFilters(): void {
    this.filter = {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      clientName: ''
    };
    this.loadRevenueData();
  }
} 