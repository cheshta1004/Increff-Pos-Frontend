import { Component, OnInit } from '@angular/core';
import { ReportService, DailyReport } from '../../services/report.service';

@Component({
  selector: 'app-daily-reports',
  template: `
    <div class="container mt-4">
      <h2>Daily Reports</h2>
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
  `]
})
export class DailyReportsComponent implements OnInit {
  reports: DailyReport[] = [];

  constructor(private reportService: ReportService) { }

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
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