import { Injectable } from '@angular/core';
import { ItemsState, Item } from './items.store.state';
import { Subject } from 'rxjs';
import { Category } from '@app/core/interfaces/categories';
import { ItemsListEndpoint } from './items.endpoint';
import { map } from 'rxjs/operators';
import { Store } from '@app/store';

@Injectable()
export class ItemsStore extends Store<ItemsState> {
  private reloadItems$: Subject<undefined> = new Subject();
  private currentPage: number = 0;
  constructor(private itemListEndpoint: ItemsListEndpoint) {
    super(new ItemsState());
  }

  fetchList(category: Category, currentPage: number) {
    console.log(currentPage);
    this.itemListEndpoint
      .listItems(category, currentPage)
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
        this.updateItemsState(items, currentPage);
      });
  }

  updateItemsState(items: Item[], currentPage: number) {
    this.setState({
      ...this.state,
      items,
      currentPage
    });
  }
}
