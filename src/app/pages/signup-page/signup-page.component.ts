import { Component } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../user.service';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-signup-page',
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  providers: [UserService]
})
export class SignupPageComponent {
  signupData = {
    name: '',
    email: '',
    password: ''
    // Role will be set automatically by the backend
  };

  errorMessage = '';
  isLoading = false;

  constructor(
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  async onSubmit(form: NgForm) {
    if (form.invalid) {
      this.errorMessage = 'Please fill all required fields correctly.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await this.userService.signup(this.signupData).toPromise();
      console.log('Signup response:', response);
      
      if (response && response.includes('successful')) {
        this.router.navigate(['/login']);
      } else {
        this.errorMessage = response || 'Signup failed';
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      this.errorMessage = error.message || 'An error occurred during signup.';
    } finally {
      this.isLoading = false;
    }
  }
}
