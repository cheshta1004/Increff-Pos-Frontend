import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

interface RevenueData {
  date: string;
  orderCount: number;
  totalItems: number;
  revenue: number;
}

@Component({
  selector: 'app-revenue-charts',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './revenue-charts.component.html',
  styleUrl: './revenue-charts.component.css'
})
export class RevenueChartsComponent implements OnInit {
  startDate = '2024-04-01';
  
  lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Revenue',
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Revenue ($)'
        }
      }
    }
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchRevenueData();
  }

  fetchRevenueData() {
    const url = `http://localhost:9001/pos/api/revenue/daily-report`;
    
    this.http.get<RevenueData[]>(url).subscribe({
      next: (data) => {
        this.lineChartData.labels = data.map(d => this.formatDate(d.date));
        this.lineChartData.datasets[0].data = data.map(d => d.revenue);
        this.lineChartData = { ...this.lineChartData };
      },
      error: (error) => {
        console.error('Error fetching revenue data:', error);
      }
    });
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}