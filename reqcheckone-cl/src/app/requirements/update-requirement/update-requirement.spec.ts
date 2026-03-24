import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateRequirement } from './update-requirement';

describe('UpdateRequirement', () => {
  let component: UpdateRequirement;
  let fixture: ComponentFixture<UpdateRequirement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UpdateRequirement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateRequirement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
