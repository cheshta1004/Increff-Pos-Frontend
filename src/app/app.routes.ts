import { Routes } from '@angular/router';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClientPageComponent } from './pages/client-page/client-page.component';
import { ProductPageComponent } from './pages/product-page/product-page.component';
import { OrderPageComponent } from './pages/order-page/order-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { SignupPageComponent } from './pages/signup-page/signup-page.component';
import { AuthGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  // Auth routes without navbar
  { path: 'login', component: LoginPageComponent },
  { path: 'signup', component: SignupPageComponent },
  { path: 'unauthorized', loadComponent: () => import('./pages/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent) },
  
  // Main app routes with navbar
  {
    path: '',
    component: NavBarComponent,
    canActivate: [AuthGuard],
    children: [
      { 
        path: 'dashboard', 
        component: DashboardComponent,
        canActivate: [roleGuard(['OPERATOR', 'SUPERVISOR'])]
      },
      { 
        path: 'clients', 
        component: ClientPageComponent,
        canActivate: [roleGuard(['OPERATOR', 'SUPERVISOR'])]
      },
      { 
        path: 'products', 
        component: ProductPageComponent,
        canActivate: [roleGuard(['OPERATOR', 'SUPERVISOR'])]
      },
      { path: 'orders', component: OrderPageComponent },
      { 
        path: 'sales-report', 
        loadComponent: () => import('./components/sales-report/sales-report.component').then(m => m.SalesReportComponent),
        canActivate: [roleGuard(['SUPERVISOR'])]
      },
      { 
        path: 'daily-report', 
        loadComponent: () => import('./components/daily-report/daily-report.component').then(m => m.DailyReportComponent),
        canActivate: [roleGuard(['SUPERVISOR'])]
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];
