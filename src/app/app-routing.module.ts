import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DailyReportsComponent } from './components/daily-reports/daily-reports.component';

const routes: Routes = [
  // ... existing routes ...
  { path: 'reports/daily', component: DailyReportsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { } 