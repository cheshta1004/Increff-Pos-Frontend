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
    startDate: this.formatDateForInput(new Date()),
    endDate: this.formatDateForInput(new Date()),
    clientName: ''
  };

  constructor(private revenueService: RevenueService) {}

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00Z`;
  }

  private formatEndDateForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T23:59:59Z`;
  }

  ngOnInit(): void {
    this.loadRevenueData();
  }

  loadRevenueData(): void {
    this.isLoading = true;
    this.error = null;

    try {
      // Format the dates properly before sending
      const formattedFilter = {
        ...this.filter,
        startDate: this.formatDateForBackend(new Date(this.filter.startDate + 'T00:00:00')),
        endDate: this.formatEndDateForBackend(new Date(this.filter.endDate + 'T00:00:00'))
      };

      this.revenueService.getFilteredSalesReport(formattedFilter).subscribe({
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
    } catch (error) {
      this.error = 'Invalid date format';
      this.isLoading = false;
      console.error('Date parsing error:', error);
    }
  }

  private calculateTotals(): void {
    this.totalRevenue = this.revenueData.reduce((sum, item) => sum + item.revenue, 0);
    this.totalQuantity = this.revenueData.reduce((sum, item) => sum + item.quantity, 0);
  }

  refreshData(): void {
    this.loadRevenueData();
  }

  clearFilters(): void {
    const today = new Date();
    this.filter = {
      startDate: this.formatDateForInput(today),
      endDate: this.formatDateForInput(today),
      clientName: ''
    };
    this.loadRevenueData();
  }
} 