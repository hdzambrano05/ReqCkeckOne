import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailRequirement } from './detail-requirement';

describe('DetailRequirement', () => {
  let component: DetailRequirement;
  let fixture: ComponentFixture<DetailRequirement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetailRequirement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailRequirement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
