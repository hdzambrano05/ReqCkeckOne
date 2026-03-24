import { TestBed } from '@angular/core/testing';

import { RequirementHistory } from './requirement-history';

describe('RequirementHistory', () => {
  let service: RequirementHistory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RequirementHistory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
