import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RevenueData } from '../models/revenue.model';
import { DailyRevenueData } from '../models/daily-revenue.model';

export interface SalesReportFilter {
  startDate: string;
  endDate: string;
  clientName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RevenueService {
  private apiUrl = 'http://localhost:9001/pos/api';

  constructor(private http: HttpClient) { }

  getMonthlyRevenue(): Observable<RevenueData[]> {
    return this.http.get<RevenueData[]>(`${this.apiUrl}/revenue/sales-report`);
  }

  getDailyReport(): Observable<DailyRevenueData[]> {
    return this.http.get<DailyRevenueData[]>(`${this.apiUrl}/reports/daily`);
  }

  getFilteredSalesReport(filter: SalesReportFilter): Observable<RevenueData[]> {
    return this.http.post<RevenueData[]>(`${this.apiUrl}/revenue/filtered-sales-report`, filter);
  }
} 