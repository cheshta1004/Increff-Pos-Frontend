import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DailyReport {
  id: number;
  date: string;
  orderCount: number;
  totalItems: number;
  revenue: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/api/reports`;

  constructor(private http: HttpClient) { }

  getAllDailyReports(): Observable<DailyReport[]> {
    return this.http.get<DailyReport[]>(`${this.apiUrl}/daily`);
  }

  getLatestDailyReports(): Observable<DailyReport[]> {
    return this.http.get<DailyReport[]>(`${this.apiUrl}/daily/latest`);
  }
} 