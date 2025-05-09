import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopClientsComponent } from './top-clients.component';

describe('TopClientsComponent', () => {
  let component: TopClientsComponent;
  let fixture: ComponentFixture<TopClientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopClientsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopClientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
