import { Injectable } from '@angular/core';
import { Subject, Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemsState } from './items.store.state';
import { Item } from '@app/core/interfaces/item';
import { Category } from '@app/core/interfaces/categories';
import { ItemMetaData } from '@app/core/interfaces/item-meta-data';
import { RealtimeDbService } from '@app/core/firebase/realtime-db.service';
import { ItemsListEndpoint } from './items.endpoint';
import { CategoryItemDetailsService } from '../category-item-details.service';
import { Store } from '@app/store';
import { Logger } from '@app/core/logger.service';

const log = new Logger('ItemsStore');

@Injectable()
export class ItemsStore extends Store<ItemsState> {
  tempItems: any;
  private reloadItems$: Subject<undefined> = new Subject();
  private currentPage = 0;
  constructor(
    private itemListEndpoint: ItemsListEndpoint,
    private realtimeDbService: RealtimeDbService,
    private categoryItemDetailsService: CategoryItemDetailsService
  ) {
    super(new ItemsState());
  }

  updateUserDescription(newDescriptionObject: any) {
    this.realtimeDbService.writeDescription(
      newDescriptionObject.event,
      newDescriptionObject.label.value,
      newDescriptionObject.category
    );
  }

  /**
   * Read a user items table from firebase.
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
   *          "item-details-viewed-date": 1234556789,
   *          "uri": "",
   *          "wikidataUri": ""
   *       },
   *       ```
   * @param category
   */
  async fetchListFromFirebase(category: Category): Promise<ItemMetaData> {
    return this.realtimeDbService
      .readUserSubData('items', category.name)
      .then(existingItems => {
        return existingItems;
      })
      .catch(error => {
        log.error('error', error);
        return error;
      });
  }
}
