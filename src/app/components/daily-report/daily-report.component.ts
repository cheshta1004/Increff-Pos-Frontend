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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
} 