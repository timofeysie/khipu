import { TestBed } from '@angular/core/testing';

import { CheckForUpdateService } from './check-for-update.service';

describe('CheckForUpdateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CheckForUpdateService = TestBed.get(CheckForUpdateService);
    expect(service).toBeTruthy();
  });
});
