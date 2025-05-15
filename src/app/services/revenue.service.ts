import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RevenueData } from '../models/revenue.model';
import { DailyRevenueData } from '../models/daily-revenue.model';
import { switchMap } from 'rxjs/operators';

export interface SalesReportFilter {
  startDate: string;
  endDate: string;
  clientName?: string;
}

export interface DailyReportFilter {
  startDate: string;
  endDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class RevenueService {
  private apiUrl = 'http://localhost:9001/pos/api';
  private invoiceApiUrl = 'http://localhost:9003/invoice/api';

  constructor(private http: HttpClient) { }

  getMonthlyRevenue(): Observable<RevenueData[]> {
    return this.http.get<RevenueData[]>(`${this.apiUrl}/revenue/sales-report`);
  }

  getDailyReport(): Observable<DailyRevenueData[]> {
    return this.http.get<DailyRevenueData[]>(`${this.apiUrl}/reports/daily`);
  }

  getFilteredDailyReport(filter: DailyReportFilter): Observable<DailyRevenueData[]> {
    return this.http.get<DailyRevenueData[]>(`${this.apiUrl}/reports/daily/range`, {
      params: {
        startDate: filter.startDate,
        endDate: filter.endDate
      }
    });
  }

  getFilteredSalesReport(filter: SalesReportFilter): Observable<RevenueData[]> {
    return this.http.post<RevenueData[]>(`${this.apiUrl}/revenue/filtered-sales-report`, filter);
  }

  downloadDailyReport(data: DailyRevenueData[], filter: DailyReportFilter): Observable<Blob> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const requestBody = {
      data: data,
      filter: filter
    };

    console.log('Sending daily report request:', {
      url: `${this.invoiceApiUrl}/invoice/daily-report`,
      headers: headers,
      body: requestBody
    });

    return this.http.post(`${this.invoiceApiUrl}/invoice/daily-report`, requestBody, {
      headers: headers,
      responseType: 'blob'
    });
  }

  downloadSalesReport(filter: SalesReportFilter): Observable<Blob> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // First get the data
    return this.getFilteredSalesReport(filter).pipe(
      switchMap(data => {
        const requestBody = {
          data: data,
          filter: filter
        };
        return this.http.post(`${this.invoiceApiUrl}/invoice/sales-report`, requestBody, {
          headers: headers,
          responseType: 'blob'
        });
      })
    );
  }
} 