import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevenueChartsComponent } from './revenue-charts.component';

describe('RevenueChartsComponent', () => {
  let component: RevenueChartsComponent;
  let fixture: ComponentFixture<RevenueChartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueChartsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevenueChartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
