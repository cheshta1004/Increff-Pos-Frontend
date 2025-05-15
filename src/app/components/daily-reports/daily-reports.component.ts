import { Component, OnInit } from '@angular/core';
import { ReportService, DailyReport } from '../../services/report.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-daily-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-4">
      <h2>Daily Reports</h2>
      
      <div class="filters-section mb-4">
        <div class="row mb-3">
          <div class="col-12">
            <div class="date-presets">
              <button class="btn btn-outline-primary me-2" (click)="setDateRange('today')">Today</button>
              <button class="btn btn-outline-primary me-2" (click)="setDateRange('yesterday')">Yesterday</button>
              <button class="btn btn-outline-primary me-2" (click)="setDateRange('last7days')">Last 7 Days</button>
              <button class="btn btn-outline-primary me-2" (click)="setDateRange('last30days')">Last 30 Days</button>
              <button class="btn btn-outline-primary me-2" (click)="setDateRange('thisMonth')">This Month</button>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label for="startDate">Start Date:</label>
              <input type="date" id="startDate" class="form-control" [(ngModel)]="startDate" (change)="loadReports()">
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label for="endDate">End Date:</label>
              <input type="date" id="endDate" class="form-control" [(ngModel)]="endDate" (change)="loadReports()">
            </div>
          </div>
          <div class="col-md-4 d-flex align-items-end">
            <button class="btn btn-secondary" (click)="clearFilters()">Clear Filters</button>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Date</th>
              <th>Orders</th>
              <th>Items</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let report of reports">
              <td>{{report.date | date}}</td>
              <td>{{report.orderCount}}</td>
              <td>{{report.totalItems}}</td>
              <td>{{report.revenue | currency}}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table th, .table td {
      text-align: center;
    }
    .filters-section {
      background-color: #f8f9fa;
      padding: 1rem;
      border-radius: 0.5rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    label {
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    .date-presets {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .btn-outline-primary {
      border-color: #0d6efd;
      color: #0d6efd;
    }
    .btn-outline-primary:hover {
      background-color: #0d6efd;
      color: white;
    }
    @media (max-width: 768px) {
      .date-presets {
        flex-direction: column;
      }
      .date-presets button {
        width: 100%;
        margin-bottom: 0.5rem;
      }
    }
  `]
})
export class DailyReportsComponent implements OnInit {
  reports: DailyReport[] = [];
  startDate: string = '';
  endDate: string = '';

  constructor(private reportService: ReportService) { }

  ngOnInit() {
    // Set default date range to last 30 days
    this.setDateRange('last30days');
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
    this.loadReports();
  }

  loadReports() {
    if (this.startDate && this.endDate) {
      this.reportService.getDailyReportsByDateRange(this.startDate, this.endDate).subscribe(
        (data) => {
          this.reports = data;
        },
        (error) => {
          console.error('Error loading reports:', error);
        }
      );
    } else {
      this.reportService.getAllDailyReports().subscribe(
        (data) => {
          this.reports = data;
        },
        (error) => {
          console.error('Error loading reports:', error);
        }
      );
    }
  }

  clearFilters() {
    this.startDate = '';
    this.endDate = '';
    this.loadReports();
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
} 