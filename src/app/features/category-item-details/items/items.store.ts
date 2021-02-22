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
  private reloadItems$: Subject<undefined> = new Subject();
  private currentPage = 0;
  tempItems: any;
  constructor(
    private itemListEndpoint: ItemsListEndpoint,
    private realtimeDbService: RealtimeDbService,
    private categoryItemDetailsService: CategoryItemDetailsService
  ) {
    super(new ItemsState());
  }

  /**
   * Refactoring WIP.
   * @param category
   * @param currentPage
   */
  async doWork(category: Category, currentPage: number) {
    const listFromFirebaseCategory = await this.fetchListFromFirebase(category);
    forkJoin(
      this.getItemsFromWikidataEndpoint(category, currentPage),
      this.getWikilistFromEndpoint(category.name, 'en', '1')
    )
      .pipe(
        map(async ([wikidataItemList, wikiListResponse]) => {
          const wikiDataList = await this.mapItemsFromWikidata(wikidataItemList, listFromFirebaseCategory, category);
          const wikiListItems = await this.parseParticularCategoryTypes(wikiListResponse, category.name, 'en', '1');
          const newList = wikiDataList.concat(wikiListItems);
          this.updateItemsState(newList, this.currentPage);
          // this.realtimeDbService.writeItemsList(newList, category.name);
          // do we delete items that are not there?
          return newList;
        })
      )
      .subscribe(result => {
        // result ZoneAwarePromise
        console.log('result', result);
      });
  }

  /**
   * From the previously named getItemsFromEndpoint which is now
   * getItemsFromWikidataEndpoint()
   * @param inc incoming response
   * @param existingItems
   * @param category
   */
  async mapItemsFromWikidata(inc: Array<any>, existingItems: any, category: any): Promise<Item[]> {
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
  }

  /**
   * Originally from fetchWikilistFromEndpoint which is now called
   * getWikilistFromEndpoint()
   * @param response
   */
  async parseParticularCategoryTypes(
    response: any,
    _title: string,
    _language: string,
    _section: string
  ): Promise<Item[]> {
    if (response) {
      const markup = response['parse']['text']['*'];
      if (_title === 'fallacies') {
        const fallyList = this.getItemsFromFallaciesList(markup);
        return fallyList;
      } else if (_title === 'cognitive_bias') {
        const cogbyList = this.getItemsFromCognitiveBiasesList(markup);
        return cogbyList;
      }
    }
    return [];
  }

  updateUserDescription(newDescriptionObject: any) {
    this.realtimeDbService.writeDescription(
      newDescriptionObject.event,
      newDescriptionObject.label.value,
      newDescriptionObject.category
    );
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

  /**
   * Replacement for fetchList()
   * @param category Replacing fetchList
   * @param currentPage paginated view
   * @returns firebase metadata json.
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

  /**
   * Get items from the Wikidata endpoint.
   * @param category
   * @param currentPage
   * @param existingItems
   */
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
        this.currentPage = currentPage;
        this.tempItems = items;
        // this.fetchWikilistFromEndpoint(category.name, 'en', '1');
        this.updateItemsState(items, currentPage);
      });
  }

  /**
   * Replacement for getItemsFromEndpoint()
   * @param category
   * @param currentPage
   */
  getItemsFromWikidataEndpoint(category: Category, currentPage: number): Observable<any> {
    return this.itemListEndpoint.listItems(category, currentPage);
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
      existingDescription = existingItems[incomingItem[properties[1]].value];
      descriptionToUse = existingDescription;
    } else {
      needToSave = true;
      existingItems = [];
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
      metaData: existingItems[incomingItemLabelKey]
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

  /**
   * Replaced by getWikilistFromEndpoint
   * @param _title
   * @param _language
   * @param _section
   */
  fetchWikilistFromEndpoint(_title: string, _language: string, _section: string) {
    this.categoryItemDetailsService
      .getWikilist({ title: _title, language: _language, section: _section })
      .subscribe((response: any) => {
        if (response) {
          let wikiList: Item[];
          if (response) {
            // TODO: replace with response type
            const markup = response['parse']['text']['*'];
            if (_title === 'fallacies') {
              wikiList = this.getItemsFromFallaciesList(markup);
              const newList = this.tempItems.concat(wikiList);
              this.updateItemsState(newList, this.currentPage);
            } else if (_title === 'cognitive_bias') {
              this.getItemsFromCognitiveBiasesList(markup);
            }
          }
        }
      });
  }

  /**
   * Replaces fetchWikilistFromEndpoint
   * @param _title
   * @param _language
   * @param _section
   */
  getWikilistFromEndpoint(_title: string, _language: string, _section: string) {
    return this.categoryItemDetailsService
      .getWikilist({ title: _title, language: _language, section: _section })
      .pipe(response => response);
  }

  getItemsFromFallaciesList(markup: any) {
    const main = this.createElementFromHTML(markup);
    const wikiItem: Item[] = this.getFirstWikiItem(main);
    return wikiItem;
  }

  /**
   * For the list of fallacies, there is an h3 signalling the arrival of spring.
   * I mean the first list which contains basic fallacies before the later sections
   * which are more finely grained..
   * @param main
   */
  getFirstWikiItem(main: any) {
    const wikiList: Item[] = [];
    // the first category is an H2 regarding the whole subject
    const firstCategory = main.getElementsByClassName('mw-headline')[0].innerHTML;
    const ul = main.getElementsByTagName('ul')[2];
    if (ul) {
      const li = ul.getElementsByTagName('li');
      const numberOfItems = li.length;
      for (let i = 0; i < numberOfItems; i++) {
        const item = li[i];
        const liAnchor: HTMLCollection = item.getElementsByTagName('a');
        // find the label and uri values
        let label;
        let uri;
        for (let numberOfLabels = 0; numberOfLabels < liAnchor.length; numberOfLabels++) {
          const potentialLabel = liAnchor[numberOfLabels].innerHTML;
          if (potentialLabel.indexOf('[') === -1) {
            // it's not a citation, keep this one.
            label = potentialLabel;
            uri = liAnchor[numberOfLabels].getAttribute('href');
          }
        }
        // find the description
        const descriptionContentMarkup = ul.getElementsByTagName('li')[i].innerHTML;
        const descriptionContent = this.removeHtml(descriptionContentMarkup);
        // remove the slash and get the content from the end of the anchor tag until the next element.
        const dash = descriptionContent.indexOf('–');
        let description = descriptionContent.substring(dash + 2, descriptionContent.length);
        description = this.removePotentialCitations(description);
        // create object
        const wikiItem: Item = {
          sectionTitle: firstCategory,
          sectionTitleTag: 'H2',
          uri,
          label,
          description
        };
        wikiList.push(wikiItem);
      }
      return wikiList;
    }
  }

  getItemsFromCognitiveBiasesList(content: any) {
    const wikiList: Item[] = [];
    const one = this.createElementFromHTML(content);
    const desc: any = one.getElementsByClassName('mw-parser-output')[0].children;
    const category = desc[0].getElementsByClassName('mw-headline')[0].innerText;
    const allDesc = desc[2];
    return wikiList;
  }

  createElementFromHTML(htmlString: string) {
    const div = document.createElement('div');
    const page = '<div>' + htmlString + '</div>';
    div.innerHTML = page.trim();
    return div;
  }

  /**
   * Removes html and special characters from an html string.
   * @param {html string} content
   */
  removeHtml(content: any) {
    const stripedHtml = content.replace(/<[^>]+>/g, '');
    let unescapedHtml = unescape(stripedHtml).trim();
    // remove newlines
    unescapedHtml = unescapedHtml.replace(/\n|\r/g, '');
    // concat spaces
    unescapedHtml = unescapedHtml.replace(/\s{2,}/g, ' ');
    unescapedHtml = unescapedHtml.replace(/&#91;/g, '[');
    unescapedHtml = unescapedHtml.replace(/&#93;/g, ']');
    unescapedHtml = unescapedHtml.replace(/&#8239;/g, '->');
    unescapedHtml = unescapedHtml.replace(/&#123;/g, '{');
    unescapedHtml = unescapedHtml.replace(/&#125;/g, '}');
    unescapedHtml = unescapedHtml.replace(/&#160;/g, '');
    unescapedHtml = unescapedHtml.replace(/&amp;/g, '&');
    return unescapedHtml;
  }

  removePotentialCitations(description: string) {
    const openingBracket = description.indexOf('[');
    if (openingBracket !== -1) {
      const closingBracket = description.indexOf(']');
      const firstPart = description.substring(0, openingBracket);
      const secondPart = description.substring(closingBracket + 1, description.length);
      description = firstPart + secondPart;
    }
    if (description.indexOf('[') !== -1) {
      description = this.removePotentialCitations(description);
    }
    return description;
  }

  writeItems(item: any) {}
}
