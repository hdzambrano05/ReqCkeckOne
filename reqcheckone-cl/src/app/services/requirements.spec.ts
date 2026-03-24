import { TestBed } from '@angular/core/testing';

import { Requirements } from './requirements';

describe('Requirements', () => {
  let service: Requirements;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Requirements);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
