import { Injectable } from '@angular/core';
import { Store } from '../../store';
import { ItemsState, Item } from './items.store.state';
import { Subject } from 'rxjs';
import { Category } from '@app/core/interfaces/categories';
import { ItemsListEndpoint } from './items.endpoint';
import { map } from 'rxjs/operators';

@Injectable()
export class ItemsStore extends Store<ItemsState> {
  private reloadItems$: Subject<undefined> = new Subject();

  constructor(private itemListEndpoint: ItemsListEndpoint) {
    super(new ItemsState());
  }

  fetchList(category: Category) {
    this.itemListEndpoint
      .listItems(category)
      .pipe(
        map(inc => {
          let list: Item[] = [];
          list = inc.map((incomingItem: any) => {
            const properties = Object.keys(incomingItem);
            const item: Item = {
              categoryType: properties[0],
              label: incomingItem[properties[1]].value,
              description: incomingItem[properties[0] + 'Description']
                ? incomingItem[properties[0] + 'Description'].value
                : '',
              type: incomingItem[properties[1]].type,
              uri: incomingItem[properties[0]].value
            };
            return item;
          });
          return list;
        })
      )
      .subscribe((items: Item[]) => {
        this.updateItemsState(items);
      });
  }

  updateItemsState(items: Item[]) {
    this.setState({
      ...this.state,
      items
    });
  }
}
