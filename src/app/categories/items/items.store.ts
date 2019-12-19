import { Injectable } from '@angular/core';
import { Store } from '../../store';
import { ItemsState } from './items.store.state';

@Injectable()
export class ItemsStore extends Store<ItemsState> {
  constructor() {
    super(new ItemsState());
  }
}
