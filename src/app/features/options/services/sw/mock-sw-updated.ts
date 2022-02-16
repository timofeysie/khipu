// import { Subject } from 'rxjs';

// class MockSwUpdate {
//   $$availableSubj = new Subject<{ available: { hash: string } }>();
//   $$activatedSubj = new Subject<{ current: { hash: string } }>();

//   available = this.$$availableSubj.asObservable();
//   activated = this.$$activatedSubj.asObservable();

//   activateUpdate = jasmine.createSpy('MockSwUpdate.activateUpdate').and.callFake(() => Promise.resolve());

//   checkForUpdate = jasmine.createSpy('MockSwUpdate.checkForUpdate').and.callFake(() => Promise.resolve());

//   constructor(public isEnabled: boolean) {}
// }
