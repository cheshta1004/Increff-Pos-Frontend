import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class LoginPageComponent {
  loginData = {
    email: '',
    password: ''
  };

  errorMessage = '';
  isLoading = false;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  onSubmit(form: any) {
    if (form.invalid) {
      this.errorMessage = 'Please fill all required fields correctly.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.userService.login(this.loginData).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error:', error);
        
        // Handle specific error cases
        if (error.status === 400) {
          this.errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.status === 401) {
          this.errorMessage = 'Invalid credentials. Please try again.';
        } else if (error.status === 404) {
          this.errorMessage = 'User not found.';
        } else if (error.status === 0) {
          this.errorMessage = 'Unable to connect to the server. Please check your connection.';
        } else {
          this.errorMessage = error?.error?.message || error.message || 'Invalid email or password';
        }
      }
    });
  }
}
