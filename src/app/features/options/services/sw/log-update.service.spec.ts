import { TestBed } from '@angular/core/testing';
import { ServiceWorkerModule } from '@angular/service-worker';
import { LogUpdateService } from './log-update.service';

describe('LogUpdateService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [ServiceWorkerModule.register('ngsw-worker.js', { enabled: false })]
    })
  );

  it('should be created', () => {
    const service: LogUpdateService = TestBed.get(LogUpdateService);
    expect(service).toBeTruthy();
  });
});
