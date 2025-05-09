import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { HasRoleDirective } from '../../directives/has-role.directive';
@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HasRoleDirective],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent {
  constructor(private router: Router) {}

  logout() {
    // Clear any stored user data or tokens here if needed
    console.log('Logging out...');
    this.router.navigate(['/login']);
  }
}
