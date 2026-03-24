import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskCreate } from './task-create';

describe('TaskCreate', () => {
  let component: TaskCreate;
  let fixture: ComponentFixture<TaskCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
