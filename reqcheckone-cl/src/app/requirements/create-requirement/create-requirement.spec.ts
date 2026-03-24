import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateRequirement } from './create-requirement';

describe('CreateRequirement', () => {
  let component: CreateRequirement;
  let fixture: ComponentFixture<CreateRequirement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateRequirement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateRequirement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
