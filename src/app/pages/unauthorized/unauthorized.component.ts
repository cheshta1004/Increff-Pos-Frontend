import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="unauthorized-container">
      <h1>Access Denied</h1>
      <p>You don't have permission to access this page.</p>
      <a routerLink="/login">Return to Login</a>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      text-align: center;
      padding: 2rem;
    }
  `]
})
export class UnauthorizedComponent {} 