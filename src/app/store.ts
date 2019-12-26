import { Observable, BehaviorSubject } from 'rxjs';

export class Store<type> {
  state$: Observable<type>;
  private _state$: BehaviorSubject<type>;

  protected constructor(initialState: type) {
    this._state$ = new BehaviorSubject(initialState);
    this.state$ = this._state$;
  }

  get state(): type {
    return this._state$.getValue();
  }

  setState(nextState: type) {
    this._state$.next(nextState);
  }
}
