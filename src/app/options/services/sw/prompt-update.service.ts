import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

function promptUser(event: any): boolean {
  return true;
}

// #docregion sw-activate
@Injectable({
    providedIn: 'root'
  })
export class PromptUpdateService {

  constructor(updates: SwUpdate) {
    updates.available.subscribe(event => {
      if (promptUser(event)) {
        updates.activateUpdate().then(() => document.location.reload());
      }
    });
  }
}
// #enddocregion sw-activate