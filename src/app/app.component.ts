// app.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { routes } from './app.routes';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from './user.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
  imports: [RouterModule, HttpClientModule],
  standalone: true,
})
export class AppComponent implements OnInit {
  title = 'POS System';
  private readonly VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  constructor(
    private userService: UserService,
    private router: Router
  ) {}
  
  private shouldValidateToken(): boolean {
    const lastCheckedTime = sessionStorage.getItem('lastCheckedTime');
    if (!lastCheckedTime) return true;
    
    const lastChecked = new Date(lastCheckedTime).getTime();
    const currentTime = new Date().getTime();
    return (currentTime - lastChecked) > this.VALIDATION_INTERVAL;
  }
  
  ngOnInit() {
    // Check if user is authenticated
    if (this.userService.isAuthenticated()) {
      // Only validate token if more than 5 minutes have passed since last check
      if (this.shouldValidateToken()) {
        this.userService.validateToken().subscribe({
          next: () => {
            // Token is valid, update last checked time
            const now = new Date();
            sessionStorage.setItem('lastCheckedTime', now.toISOString());
          },
          error: (error) => {
            console.error('Token validation error:', error);
            // Token is invalid, clear session and redirect to login
            this.userService.logout();
            this.router.navigate(['/login']);
          }
        });
      }
    } else {
      // If not authenticated and not on login page, redirect to login
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup') {
        this.router.navigate(['/login']);
      }
    }
  }
}