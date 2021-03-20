import { Injectable } from '@angular/core';
import { Store } from '@app/store';
import { Item } from '@app/core/interfaces/item';
import { RealtimeDbService } from '@app/core/firebase/realtime-db.service';
import { CategoryItemDetailsService } from '../category-item-details.service';
import { Logger } from '@app/core/logger.service';
import { CategoriesState } from './categories-store-state';
import { CategoriesEndpoint } from './categories.endpoint';
import { ItemsListEndpoint } from '../items/items.endpoint';
import { Category } from '@app/core/interfaces/categories';
import { Subject, Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nService } from '@app/core';
import { environment } from '@env/environment.prod';

const log = new Logger('CategoriesStore');

@Injectable()
export class CategoriesStore extends Store<CategoriesState> {
  constructor(
    private categoryItemDetailsService: CategoryItemDetailsService,
    private realtimeDbService: RealtimeDbService,
    private categoriesEndpoint: CategoriesEndpoint,
    private itemListEndpoint: ItemsListEndpoint,
    private i18nService: I18nService
  ) {
    super(new CategoriesState());
  }

  fetchList() {
    this.realtimeDbService
      .readUserData('categories')
      .then(result => {
        const cats: any = [];
        Object.keys(result).forEach(key => {
          const value = result[key];
          cats.push(value);
        });
        this.state.categories = cats;
      })
      .catch(error => {
        log.debug('error fetching list', error);
        log.debug('try getting categories form endpoint');
        this.getCategoriesFromEndpoint();
      });
  }

  getCategoriesFromEndpoint() {
    const currentLanguage = this.i18nService.language;
    const sparqlLanguages = environment.sparqlLanguages;
    const sparqlLanguageObject = sparqlLanguages.find(i => i.appLanguage === currentLanguage);
    this.categoriesEndpoint
      .fetchList()
      .pipe(
        map((rawCategoryList: Category[]) => {
          const list: Category[] = rawCategoryList.map(rawCategory => {
            const category: Category = { ...rawCategory, language: sparqlLanguageObject.sparqlLanguage };
            return category;
          });
          this.realtimeDbService.writeCategories(list);
          return list;
        })
      )
      .subscribe((categoriesFromEndpoint: Category[]) => {
        this.state.categories = categoriesFromEndpoint;
      });
  }

  /**
   * Overwrite the current list by subject with the currently loaded list.
   * @param newCategory
   */
  saveNewCategory(newCategory: Category) {
    const newList = this.convertWikidataListToItems(newCategory);
    newList.push(...this.state.wikiListItems);

    // Other possible features:
    // Collect a list of items that are on firebase but not on wikidata:
    // these items might have been deleted and the user should be notified.
    // Collect a list of items that or on wikidata, but no firebase:
    // this should be all items on a new list that is created for the first time.
    // If there is a pre-existing firebase list, collect a new list of items that
    // don't exist on it as these are newly added items and the user should be notified.

    this.realtimeDbService.writeNewItemList(newList, newCategory['categoryName']);

    // create item objects out of wikidataItemList.
    // this.setState({ ...this.state, categories: [newCategory] });
    // this.categoriesEndpoint.addCategory(newCategory);
  }

  /**
   * Convert from a wikidata object list to an Item list.
   * @param newCategory
   * @returns
   */
  convertWikidataListToItems(newCategory: Category): Item[] {
    const newList: Item[] = [];
    this.state.wikidataItemList.forEach(wikiDataItem => {
      let label = '';
      const labelPropertyName = newCategory['categoryName'] + 'Label';
      const wikiData = wikiDataItem[labelPropertyName];
      if (wikiData && typeof wikiData.value !== 'undefined') {
        label = wikiData.value;
      }
      let description = '';
      const wikidataItem = wikiDataItem[newCategory['categoryName'] + 'Description'];
      if (wikidataItem && typeof wikiDataItem['value'] !== 'undefined') {
        description = wikiDataItem['value'];
      }
      let wikidataUri = '';
      const wikidataItemUri = wikiDataItem[newCategory['categoryName']];
      if (wikidataItemUri && typeof wikidataItemUri.value !== 'undefined') {
        wikidataUri = wikidataItemUri.value;
      }
      const newItem = this.createNewItem(label, description, null, wikidataUri);
      if (this.state.wikiListItems.some(thisItem => thisItem.label === newItem.label)) {
        // duplicate
        // add wikidataUri as well as uri?
      } else {
        newList.push(newItem);
      }
    });
    return newList;
  }

  loadNewCategory(newCategory: Category) {
    newCategory.name = newCategory['categoryName'];
    const currentPage = 0;
    forkJoin(
      this.getAllItemsFromWikidataEndpoint(newCategory, currentPage),
      this.getWikilistFromEndpoint(newCategory.name, 'en', 'all')
    )
      .pipe(
        map(async ([wikidataItemList, wikiListResponse]) => {
          const wikiListItems = await this.parseParticularCategoryTypes(wikiListResponse, newCategory.name, 'en');
          this.state.wikidataItemList = wikidataItemList;
          this.state.wikiListItems = wikiListItems;
        })
      )
      .subscribe();
  }

  /**
   * Originally from fetchWikilistFromEndpoint which is now called
   * getWikilistFromEndpoint()
   * We will hopefully remove these hard-coded decisions based on subject types
   * when we can parse an arbitrary list of items and get the label/description
   * pairs without specific format handling.
   * @param response
   */
  async parseParticularCategoryTypes(response: any, _title: string, _language: string): Promise<Item[]> {
    if (response) {
      const markup = response.parse.text['*'];
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

  /**
   * To be re-implemented from a previous version.
   * @param content
   */
  getItemsFromCognitiveBiasesList(content: any) {
    const wikiList: Item[] = [];
    const one = this.createElementFromHTML(content);
    const desc: any = one.getElementsByClassName('mw-parser-output')[0].children;
    // const category = desc[0].getElementsByClassName('mw-headline')[0].innerText;
    // const allDesc = desc[2];
    return wikiList;
  }

  /**
   * Create an element from the document passed in
   * and parse it for an array of items and descriptions.
   * @param markup
   */
  getItemsFromFallaciesList(markup: any) {
    const main = this.createElementFromHTML(markup);
    const wikiItem: Item[] = this.parseAllWikipediaPageItems(main);
    return wikiItem;
  }

  /**
   * TODO: refactor this into a rules engine or some kind of pattern that
   * can match various item/description layouts to create a list.
   * We have not captured the type (category, sub-category, citations, etc).
   * Since they are not part of the simple list, we wont need them yet.
   * @param main
   */
  parseAllWikipediaPageItems(main: HTMLDivElement) {
    const wikiList: Item[] = [];
    const unorderedLists = main.getElementsByTagName('ul');
    const numberOfUnorderedLists = unorderedLists.length;
    let endOfList = false;
    for (let i = 0; i < numberOfUnorderedLists; i++) {
      if (endOfList) {
        break;
      }
      const ul = unorderedLists[i];
      const li = ul.getElementsByTagName('li');
      for (let j = 0; j < li.length; j++) {
        const item = li[j];
        const liAnchor: HTMLCollection = item.getElementsByTagName('a');
        const tr: HTMLCollectionOf<any> = item.getElementsByTagName('tr');
        if (tr.length) {
          // what was this to catch?
        }
        const label = this.parseLabel(item);
        const content = item.textContent || item.innerText || '';
        const descriptionWithoutLabel = this.removeLabelFromDescription(content, label);
        let descWithoutCitations = this.removePotentialCitations(descriptionWithoutLabel);
        // Only capture items that have a label, which excludes table of contents, etc.
        if (label !== null) {
          const uri = liAnchor[0].getAttribute('href');
          // check for end of list and break out of loops if it is
          if (this.checkForEndOfList(label, item)) {
            endOfList = true;
            break;
          }
          // If the item has a sub-list, capture those items also and remove them from the description.
          const subList: Item[] = this.checkForSubListAndParseIfExists(item, label, wikiList);
          if (subList) {
            wikiList.push(...subList);
            descWithoutCitations = this.removeSubListMaterial(descriptionWithoutLabel, subList);
            // This call again seems redundant, which is a bit of a smell and should be sorted out.
            descWithoutCitations = this.removePotentialCitations(descWithoutCitations);
          }
          // create item and add it to the list
          const newWikiItem = this.createNewItem(label, descWithoutCitations, uri);
          if (wikiList.some(thisItem => thisItem.label === newWikiItem.label)) {
            // skip adding duplicates
          } else {
            wikiList.push(newWikiItem);
          }
        }
      }
    }
    return wikiList;
  }

  /**
   * If an item in a list has a sub-list of items, then after parsing the sub-list,
   * we want to remove that from the description which would have beed created for
   * the list item.  We do that by looking for the first item on the sub-list, and
   * removing everything from that point to the end.  Hope it works for other categories!
   * @param descriptionWithoutLabel
   * @param subList
   */
  removeSubListMaterial(descriptionWithoutLabel: string, subList: Item[]) {
    if (subList.length > 0) {
      const firstLabel = subList[0].label;
      const end = descriptionWithoutLabel.indexOf(firstLabel);
      const descriptionWithoutCitations = descriptionWithoutLabel.substr(0, end);
      const newDescription = this.removePotentialCitations(descriptionWithoutCitations);
      return newDescription;
    } else {
      return descriptionWithoutLabel;
    }
  }

  /**
   * This repeats the loops in the previous function, but might have
   * some specific differences.  If we can combine all these into a
   * reusable looping function using a for-of loop, that would be great.
   * @param item
   * @param label
   */
  checkForSubListAndParseIfExists(item: HTMLLIElement, label: string, wikiList: Item[]) {
    const subWikiList: Item[] = [];
    const subUnorderedList = item.getElementsByTagName('ul');
    if (subUnorderedList.length > 0) {
      for (let k = 0; k < subUnorderedList.length; k++) {
        const subul = subUnorderedList[k];
        const subli = subul.getElementsByTagName('li');
        for (let l = 0; l < subli.length; l++) {
          const subItem = subli[l];
          const liAnchor: HTMLCollection = subItem.getElementsByTagName('a');
          const subLabel = this.parseLabel(subItem);
          const content = subItem.textContent || subItem.innerText || '';
          const descriptionWithoutLabel = this.removeLabelFromDescription(content, subLabel);
          const descWithoutCitations = this.removePotentialCitations(descriptionWithoutLabel);
          const uri = liAnchor[0].getAttribute('href');
          const newWikiItem = this.createNewItem(subLabel, descWithoutCitations, uri);
          if (wikiList.some(thisItem => thisItem.label === newWikiItem.label)) {
            // don't add duplicates
          } else {
            subWikiList.push(newWikiItem);
          }
        }
      }
    }
    return subWikiList;
  }

  /**
   * Needs work.
   * @param label
   * @param item
   */
  checkForEndOfList(label: string, item: HTMLLIElement): boolean {
    if (label === 'Lists portal') {
      const span = item.getElementsByTagName('span');
      const img = span[0].innerHTML;
      if (img.indexOf('//upload.wikimedia.org/wikipedia/commons/thumb/2/20/Text-x-generic.svg/') !== -1) {
        return true;
      }
    }
    return false;
  }

  createNewItem(label: string, description: string, uri: string, wikidataUri?: string) {
    const wikiItem: Item = {
      uri,
      label,
      description,
      wikidataUri
    };
    return wikiItem;
  }

  /**
   *
   * @param item string full contents of li tag.
   */
  removeLabelFromDescription(item: string, label: string) {
    const indexOfLabel = item.indexOf(label);
    if (indexOfLabel !== -1) {
      item = item.substr(label.length, item.length);
    }
    const dash = item.indexOf('–');
    let start = 0;
    const end = item.length;
    if (dash > 0) {
      start = dash;
    }
    const startChar = item.charAt(start + 1);
    let increment = 0;
    if (startChar === ' ') {
      increment = 1;
    }
    const result = item.substr(start + increment, end);
    return result;
  }

  /**
   * @param item
   * Check for a dash and remove all the text after that.
   */
  removemDescriptionFromLabel(item: string) {
    const dash = item.indexOf('–');
    let start = 0;
    if (dash > 0) {
      start = dash;
    }
    const startChar = item.charAt(start - 1);
    let increment = 0;
    if (startChar === ' ') {
      increment = 1;
    }
    return item.substr(0, start - increment);
  }

  /** Get the label from an anchor tag.
   * If there is no anchor tag, then get the contents of the <li> tag and
   * cut it off at the first slash.
   * Exclude table of contents numbers: returning null will mean this item is skipped.
   */
  parseLabel(item: any) {
    const liAnchor: HTMLCollection = item.getElementsByTagName('a');
    let label = liAnchor[0].innerHTML;
    let newLabel = null;
    if (label.indexOf('[') !== -1) {
      const content = item.textContent || item.innerText || '';
      newLabel = this.removemDescriptionFromLabel(content);
      newLabel = label = this.removeBrackets(newLabel);
      return newLabel;
    } else {
    }
    if (label.indexOf('tocnumber') === -1) {
      return label;
    } else {
      return null;
    }
  }

  /**
   * Remove citation blocks.
   * TODO: handle the situation where there is only one part of the brackets left.
   * @param str label
   * @returns string Returns the part before and after brackets.
   */
  removeBrackets(str: string): string {
    const openBracket = str.indexOf('[');
    const closeBracket = str.indexOf(']');
    if (openBracket === -1 || closeBracket === -1) {
      return str;
    }
    const firstPart = str.substr(0, openBracket);
    let offset = 0;
    if (str.length > closeBracket + offset) {
      offset = 1;
    }
    const secondPart = str.substr(closeBracket + offset, str.length);
    let result = firstPart + secondPart;
    if (str.indexOf('[')) {
      result = this.removePotentialCitations(result);
    }
    return result;
  }

  /**
   * For the list of fallacies, there is an h3 signalling the arrival of spring.
   * I mean the first list which contains basic fallacies before the later sections
   * which are more finely grained..
   * @param main
   */
  getFirstWikiItemOfSection(main: any) {
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

  /**
   * @deprecated moved
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

  createElementFromHTML(htmlString: string) {
    const div = document.createElement('div');
    const page = '<div>' + htmlString + '</div>';
    div.innerHTML = page.trim();
    return div;
  }

  getWikilistFromEndpoint(_title: string, _language: string, _section: string) {
    return this.categoryItemDetailsService
      .getWikilist({ title: _title, language: _language, section: _section })
      .pipe(response => response);
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
   * Replacement for getItemsFromEndpoint() & getItemsFromWikidataEndpoint
   * @param category
   * @param currentPage
   */
  getAllItemsFromWikidataEndpoint(category: Category, currentPage: number): Observable<any> {
    return this.itemListEndpoint.listAllItems(category);
  }
}
