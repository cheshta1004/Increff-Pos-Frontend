import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

interface TopClientsData {
  clientId: number;
  clientName: string;
  orderCount: number;
  totalValue: number;
}

@Component({
  selector: 'app-top-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './top-clients.component.html',
  styleUrls: ['./top-clients.component.css']
})
export class TopClientsComponent implements OnInit {
  topClientsData: TopClientsData[] = [];
  selectedMetric: string = 'value';
  isLoading: boolean = false;
  error: string | null = null;

  // Pie Chart configuration
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 12
          }
        }
      }
    }
  };

  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchTopClientsData();
  }

  fetchTopClientsData() {
    this.isLoading = true;
    this.error = null;
    
    const url = `http://localhost:9001/pos/api/clients/top-clients/${this.selectedMetric}`;
    
    this.http.get<TopClientsData[]>(url).subscribe({
      next: (data) => {
        this.topClientsData = data;
        this.updateChartData();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to fetch top clients data';
        console.error('Error fetching top clients:', err);
        this.isLoading = false;
      }
    });
  }

  updateChartData() {
    // Sort data by selected metric in descending order
    const sortedData = [...this.topClientsData].sort((a, b) => 
      this.selectedMetric === 'value' ? b.totalValue - a.totalValue : b.orderCount - a.orderCount
    );
    
    // Take top 5 clients
    const top5 = sortedData.slice(0, 5);
    
    const labels = top5.map(client => client.clientName);
    const values = top5.map(client => 
      this.selectedMetric === 'value' ? client.totalValue : client.orderCount
    );

    // Update pie chart
    this.pieChartData = {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  }

  onMetricChange() {
    this.fetchTopClientsData();
  }
}
  