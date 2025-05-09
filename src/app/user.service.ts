import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { isPlatformBrowser } from '@angular/common';

interface LoginResponse {
  token: string;
  [key: string]: any;
}

interface JwtPayload {
  sub: string;
  role: string;
  [key: string]: any;
}

// user.service.ts
@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = 'http://localhost:9001/pos/api/user';
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  login(credentials: {email: string, password: string}): Observable<any> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials)
      .pipe(
        map(response => {
          if (response && response.token) {
            const decodedToken = jwtDecode<JwtPayload>(response.token);
            const user = {
              token: response.token,
              email: decodedToken.sub,
              role: decodedToken.role
            };
            this.storeUserData(user);
            this.currentUserSubject.next(user);
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  logout() {
    if (this.isBrowser) {
      sessionStorage.clear();
    }
    this.currentUserSubject.next(null);
  }

  validateToken(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.baseUrl}/validate`, { headers })
      .pipe(catchError(this.handleError));
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return sessionStorage.getItem('token');
  }

  signup(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/signup`, user)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Add user profile management methods here
  updateProfile(userData: any): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.getToken()}`);
    return this.http.put(`${this.baseUrl}/profile`, userData, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  getProfile(): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.getToken()}`);
    return this.http.get(`${this.baseUrl}/profile`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  private getUserFromStorage() {
    if (!this.isBrowser) {
      return null;
    }
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken = jwtDecode<JwtPayload>(token);
        return {
          token,
          email: decodedToken.sub,
          role: decodedToken.role
        };
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }

  private storeUserData(user: any) {
    if (!this.isBrowser) {
      return;
    }
    sessionStorage.setItem('token', user.token);
    sessionStorage.setItem('email', user.email);
    sessionStorage.setItem('role', user.role);
    const now = new Date();
    sessionStorage.setItem('lastCheckedTime', now.toISOString());
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
