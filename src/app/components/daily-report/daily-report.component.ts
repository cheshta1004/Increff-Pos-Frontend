import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RevenueService } from '../../services/revenue.service';
import { DailyRevenueData } from '../../models/daily-revenue.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-daily-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './daily-report.component.html',
  styleUrls: ['./daily-report.component.css']
})
export class DailyReportComponent implements OnInit {
  dailyData: DailyRevenueData[] = [];
  isLoading = false;
  error: string | null = null;
  totalRevenue = 0;
  totalOrders = 0;
  totalItems = 0;
  startDate: string = '';
  endDate: string = '';
  today: string;

  constructor(
    private revenueService: RevenueService,
    private toastr: ToastrService
  ) {
    // Set today's date in YYYY-MM-DD format
    const now = new Date();
    this.today = this.formatDateForInput(now);
  }

  ngOnInit(): void {
    // Set default date range to last 30 days
    this.setDateRange('last30days');
  }

  private validateDates(): boolean {
    if (!this.startDate || !this.endDate) {
      this.toastr.error('Please select both start and end dates');
      return false;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today

    if (start > end) {
      this.toastr.error('Start date cannot be after end date');
      return false;
    }

    if (end > today) {
      this.toastr.error('End date cannot be after today');
      return false;
    }

    return true;
  }

  setDateRange(range: string) {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (range) {
      case 'today':
        // Start and end are both today
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'last7days':
        start.setDate(today.getDate() - 6); // Last 7 days including today
        break;
      case 'last30days':
        start.setDate(today.getDate() - 29); // Last 30 days including today
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
    }

    this.startDate = this.formatDateForInput(start);
    this.endDate = this.formatDateForInput(end);
    this.loadDailyReport();
  }

  loadDailyReport(): void {
    if (!this.validateDates()) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    const filter = {
      startDate: this.startDate,
      endDate: this.endDate
    };

    this.revenueService.getFilteredDailyReport(filter).subscribe({
      next: (data) => {
        console.log('Raw data from backend:', JSON.stringify(data, null, 2));
        this.dailyData = data;
        this.calculateTotals();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load daily report data';
        console.error('Error loading daily report:', err);
        this.isLoading = false;
        this.toastr.error('Failed to load daily report data');
      }
    });
  }

  private calculateTotals(): void {
    this.totalRevenue = this.dailyData.reduce((sum, item) => sum + item.revenue, 0);
    this.totalOrders = this.dailyData.reduce((sum, item) => sum + item.orderCount, 0);
    this.totalItems = this.dailyData.reduce((sum, item) => sum + item.totalItems, 0);
  }

  clearFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.dailyData = [];
    this.totalRevenue = 0;
    this.totalOrders = 0;
    this.totalItems = 0;
    this.loadDailyReport();
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatDate(dateString: string): string {
    try {
      if (!dateString) {
        console.error('Date string is null or undefined');
        return 'Invalid Date';
      }

      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Invalid Date';
      }

      return new Intl.DateTimeFormat('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  downloadReport(): void {
    if (!this.validateDates()) {
      return;
    }

    this.isLoading = true;
    const filter = {
      startDate: this.startDate,
      endDate: this.endDate
    };

    this.revenueService.downloadDailyReport(this.dailyData, filter).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `daily-report-${this.startDate}-to-${this.endDate}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error downloading report:', err);
        this.toastr.error('Failed to download report');
        this.isLoading = false;
      }
    });
  }
} 