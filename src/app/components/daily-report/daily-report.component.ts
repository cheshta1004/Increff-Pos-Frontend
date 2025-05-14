import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RevenueService } from '../../services/revenue.service';
import { DailyRevenueData } from '../../models/daily-revenue.model';

@Component({
  selector: 'app-daily-report',
  standalone: true,
  imports: [CommonModule],
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

  constructor(private revenueService: RevenueService) {}

  ngOnInit(): void {
    this.loadDailyReport();
  }

  loadDailyReport(): void {
    this.isLoading = true;
    this.error = null;

    this.revenueService.getDailyReport().subscribe({
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
      }
    });
  }

  private calculateTotals(): void {
    this.totalRevenue = this.dailyData.reduce((sum, item) => sum + item.revenue, 0);
    this.totalOrders = this.dailyData.reduce((sum, item) => sum + item.orderCount, 0);
    this.totalItems = this.dailyData.reduce((sum, item) => sum + item.totalItems, 0);
  }

  refreshData(): void {
    this.loadDailyReport();
  }

  formatDate(dateString: string): string {
    try {
      if (!dateString) {
        console.error('Date string is null or undefined');
        return 'Invalid Date';
      }

      // Parse the ISO date string
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Invalid Date';
      }

      // Format the date in Indian locale with timezone
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
} 