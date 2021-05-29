import { TestBed } from '@angular/core/testing';
import { ServiceWorkerModule } from '@angular/service-worker';
import { CheckForUpdateService } from './check-for-update.service';

describe('CheckForUpdateService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [ServiceWorkerModule.register('ngsw-worker.js', { enabled: false })]
    })
  );

  it('should be created', () => {
    const service: CheckForUpdateService = TestBed.get(CheckForUpdateService);
    expect(service).toBeTruthy();
  });
});
