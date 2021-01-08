import { Injectable } from '@angular/core';
import { ItemsState } from './items.store.state';
import { Item } from '@app/core/interfaces/item';
import { Subject } from 'rxjs';
import { Category } from '@app/core/interfaces/categories';
import { RealtimeDbService } from '@app/core/firebase/realtime-db.service';
import { ItemsListEndpoint } from './items.endpoint';
import { map } from 'rxjs/operators';
import { Store } from '@app/store';
import { Logger } from '@app/core/logger.service';

const log = new Logger('ItemsStore');

@Injectable()
export class ItemsStore extends Store<ItemsState> {
  private reloadItems$: Subject<undefined> = new Subject();
  private currentPage = 0;
  constructor(private itemListEndpoint: ItemsListEndpoint, private realtimeDbService: RealtimeDbService) {
    super(new ItemsState());
  }

  /**
   * Read a user items table and return a list which may have
   * a user description.
   * It also gets the result from an API endpoint.  If there is a user description
   * it should replace the result description.
   * The firebase data JSON looks like this:
   * "items": {
   *   ```json
   *     "<user-id>": {
   *       "fallacies": {
   *       "current-page": "0",
   *       "total-pages": "0",
   *       "item-list": {
   *        "Fallacy of composition": {
   *          "user-description": "blah blah blah",
   *          "user-description-viewed-count": 0,
   *          "item-details-viewed-count": 0,
   *          "item-details-viewed-date": 1234556789
   *       },
   *       ```
   * @param category
   * @param currentPage
   */
  fetchList(category: Category, currentPage: number) {
    this.realtimeDbService
      .readUserSubData('items', category.name)
      .then(existingItems => {
        // check if items exist already
        // get the paginated item list from an API call and
        // save the merged list
        this.getItemsFromEndpoint(category, currentPage, existingItems);
      })
      .catch(error => {
        log.error('error', error);
      });
  }

  getItemsFromEndpoint(category: Category, currentPage: number, existingItems: any) {
    this.itemListEndpoint
      .listItems(category, currentPage)
      .pipe(
        map(inc => {
          let list: Item[] = [];
          let listChanged = false;
          list = inc.map((incomingItem: any) => {
            const results = this.getItemWithDescription(incomingItem, existingItems);
            listChanged = results.needToSave;
            return results.item;
          });
          if (listChanged) {
            this.realtimeDbService.writeItemsList(list, category.name);
          }
          return list;
        })
      )
      .subscribe((items: Item[]) => {
        // merge in the existing
        // if old objects exist,
        // we need to overwrite the
        // API result meta-data (user-description)
        // with the previous version.
        this.updateItemsState(items, currentPage);
      });
  }

  /**
   * The existing items might have a user description.
   * @param incomingItem
   * @param existingItems An entry from firebase with the user description and other metadata.
   * @param needToSave we only save the results if anything has been
   */
  getItemWithDescription(incomingItem: any[], existingItems: any[]) {
    const properties = Object.keys(incomingItem);
    let incomingItemLabelKey; // user to
    let descriptionToUse;
    let existingDescription;
    let incomingItemDescription;
    let needToSave = false;
    // check the existing items with the key in the incoming items and use that first,
    // get the incoming item key
    if (incomingItem[properties[0] + 'Label']) {
      incomingItemLabelKey = incomingItem[properties[0] + 'Label'].value;
    }
    if (existingItems && existingItems[incomingItemLabelKey]) {
      existingDescription = incomingItem[incomingItem[properties[1]].value];
    } else {
      needToSave = true;
    }
    // otherwise use the incoming API description if there is one.
    if (incomingItem[properties[0] + 'Description']) {
      incomingItemDescription = incomingItem[properties[0] + 'Description'].value;
    }
    if (existingDescription && existingDescription.length > 0) {
      descriptionToUse = existingDescription;
    } else {
      descriptionToUse = incomingItemDescription;
    }
    const item: Item = {
      categoryType: properties[0],
      label: incomingItem[properties[1]].value,
      type: incomingItem[properties[1]].type,
      description: descriptionToUse,
      uri: incomingItem[properties[0]].value,
      binding: existingItems[incomingItemLabelKey],
      metaData: existingItems[incomingItem[properties[1]].value]
    };
    return { needToSave, item };
  }

  updateItemsState(items: Item[], currentPage: number) {
    this.setState({
      ...this.state,
      items,
      currentPage
    });
  }

  writeItems(item: any) {}
}
