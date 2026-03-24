import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryRequirements } from './history-requirements';

describe('HistoryRequirements', () => {
  let component: HistoryRequirements;
  let fixture: ComponentFixture<HistoryRequirements>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HistoryRequirements]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryRequirements);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
