import { TestBed } from '@angular/core/testing';
import { ServiceWorkerModule } from '@angular/service-worker';
import { PromptUpdateService } from './prompt-update.service';

describe('PromptUpdateService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [ServiceWorkerModule.register('ngsw-worker.js', { enabled: false })]
    })
  );

  it('should be created', () => {
    const service: PromptUpdateService = TestBed.get(PromptUpdateService);
    expect(service).toBeTruthy();
  });
});
