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

export enum Types {
  UnorderedList, // Fallacies: Types.UnorderedList
  TableList // Cognitive biases
}

@Injectable()
export class CategoriesStore extends Store<CategoriesState> {
  // Item rejection counters
  rejectedForNavigation: number;
  rejectedAfterSeeAlso: number;
  rejectedForReference: number;
  rejectedForCitation: number;
  rejectedForNoLabel: number;
  rejectedDuplicate: number;
  rejectedAsList: number;
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
        if (result) {
          Object.keys(result).forEach(key => {
            const value = result[key];
            cats.push(value);
          });
          this.state.categories = cats;
        }
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

  /**
   * For join the wikipedia and wikidata server calls and set the state
   * with their results.
   * @param newCategory
   */
  loadNewCategory(newCategory: Category) {
    newCategory.name = newCategory['categoryName'].replace(/\n/g, '').trim();
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
   * TODO: The hardwired choices are just a starting point for now.  This function
   * will ideally be replaced with a choice of sections instead of list of, or
   * it can be removed if all sources should receive the same parsing treatment.
   * @param response An array of Item objects.
   */
  async parseParticularCategoryTypes(response: any, _title: string, _language: string): Promise<Item[]> {
    this.rejectedForNavigation = 0;
    this.rejectedAfterSeeAlso = 0;
    this.rejectedForReference = 0;
    this.rejectedForCitation = 0;
    this.rejectedForNoLabel = 0;
    this.rejectedDuplicate = 0;
    this.rejectedAsList = 0;
    if (response) {
      const markup = response.parse.text['*'];
      if (_title === 'fallacies') {
        const fallyList = this.getItemsFromFallaciesList(markup);
        this.logResults();
        return fallyList;
      } else if (_title === 'cognitive_biases') {
        const cogbyList = this.parseList(markup);
        this.logResults();
        return cogbyList;
      }
    }
    return [];
  }

  logResults() {
    console.log('rejectedForNavigation', this.rejectedForNavigation);
    console.log('rejectedAfterSeeAlso', this.rejectedAfterSeeAlso);
    console.log('rejectedForReference', this.rejectedForReference);
    console.log('rejectedForCitation', this.rejectedForCitation);
    console.log('rejectedForNoLabel', this.rejectedForNoLabel);
    console.log('rejectedDuplicate', this.rejectedDuplicate);
    console.log('rejectedAsList', this.rejectedAsList);
  }

  /**
   * @deprecated this is not used?
   * TODO: re-implemented from a previous version.
   * @param content
   */
  getItemsFromCognitiveBiasesList(content: any) {
    const one = this.createElementFromHTML(content);
    // const desc: any = one.getElementsByClassName('mw-parser-output')[0].children;
    // const category = desc[0].getElementsByClassName('mw-headline')[0].innerText;
    // const allDesc = desc[2];
    const wikiList: Item[] = this.parseAllWikipediaPageItems(one, Types.TableList);
    return wikiList;
  }

  /**
   * Create an element from the document passed in
   * and parse it for an array of items and descriptions.
   * @param markup
   */
  getItemsFromFallaciesList(markup: any) {
    const main = this.createElementFromHTML(markup);
    const wikiItem: Item[] = this.parseAllWikipediaPageItems(main, Types.UnorderedList);
    return wikiItem;
  }

  /**
   * TODO: refactor this into a rules engine or some kind of pattern that
   * can match various item/description layouts to create a list.
   * We have not captured the type (category, sub-category, citations, etc).
   * Since they are not part of the simple list, we wont need them yet.
   * @param main
   */
  parseAllWikipediaPageItems(main: HTMLDivElement, type: Types) {
    const wikiList: Item[] = [];
    const unorderedLists = main.getElementsByTagName('ul');
    const numberOfUnorderedLists = unorderedLists.length;
    console.log('numberOfUnorderedLists', numberOfUnorderedLists);
    let endOfList = false;
    for (let i = 0; i < numberOfUnorderedLists; i++) {
      if (endOfList) {
        break;
      }
      const ul = unorderedLists[i];
      const li = ul.getElementsByTagName('li');
      for (let j = 0; j < li.length; j++) {
        const item = li[j];
        const label = this.parseLabel(item);
        // check for end of unordered list and stop parsing if it is
        if (type === Types.UnorderedList) {
          if (this.checkForEndOfUnorderedList(label, item)) {
            endOfList = true;
            break;
          }
        }
        if (this.checkParent(item, type) && this.checkContent(label, item)) {
          const liAnchor: HTMLCollection = item.getElementsByTagName('a');
          const content = item.textContent || item.innerText || '';
          const descriptionWithoutLabel = this.removeLabelFromDescription(content, label);
          let descWithoutCitations = this.removePotentialCitations(descriptionWithoutLabel);
          // Only capture items that have a label, which excludes table of contents, etc.
          if (label !== null) {
            const uri = liAnchor[0].getAttribute('href');
            const excludeItem = this.checkForEndOfListItem(label, item, type);
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
            } else if (!excludeItem) {
              wikiList.push(newWikiItem);
            }
          } else {
            console.log('rejectedForNoLabel');
            this.rejectedForNoLabel++;
          }
        }
      }
    }
    return wikiList;
  }

  /**
   * Check the role of the parent element.  If it's role is navigation,
   * return false so the list can be skipped.
   * @param item
   * @returns Returns true if parent role is not 'navigation'.
   */
  checkParent(item: HTMLLIElement, type: Types) {
    // check for navigation items
    const parent = item.parentElement;
    const grandParent = parent.parentElement;
    const roleParent = parent.getAttribute('role');
    const roleGrandParent = grandParent.getAttribute('role');
    if (roleParent === 'navigation' || roleGrandParent === 'navigation') {
      console.log('rejectedForNavigation');
      this.rejectedForNavigation++;
      return false;
    }
    // check for references in ordered lists
    const greatGrandParent = grandParent.parentElement;
    const orderedListGGP = greatGrandParent.getElementsByTagName('ol');
    if (orderedListGGP.length > 0 && type === Types.TableList) {
      // This doesn't work for some reason.
      // this.rejectedForReference++;
      console.log('rejectedForReference not used');
      return false;
    }
    return true;
  }

  /**
   * Check the content for a string such as:
   * 'Wikipedia list article'
   * @param item
   * @returns true if string does not exist in content, or false if it does.
   */
  checkContent(label: string, item: HTMLElement) {
    const content = item.textContent || item.innerText || '';
    if (content.indexOf('Wikipedia list article') !== -1 || content.indexOf('List of') !== -1) {
      console.log('rejectedAsList');
      this.rejectedAsList++;
      return false;
    }

    // check for references
    const ol = item.getElementsByTagName('cite');
    if (ol.length > 0) {
      console.log('rejectedForCitation');
      this.rejectedForCitation++;
      return false;
    }
    if (label === 'ISBN') {
      console.log('rejectedForReference');
      this.rejectedForReference++;
      return false;
    }

    return true;
  }

  logParsing(title: string, label: string, item: HTMLLIElement, i: number, j: number) {
    if (label.includes('ISBN')) {
      const greatGandParent = item.parentElement.parentElement.parentElement;
      const orderedListGGP = greatGandParent.getElementsByTagName('ol');
      const content = item.textContent || item.innerText || '';
    }
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
            console.log('rejectedDuplicate');
            this.rejectedDuplicate++;
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
   * This was the old function used the first time that the list of fallacies/<ul> type
   * was done successfully.
   * Because if relies on this specific tag, it's probably not going to work well for other types.
   * @param label
   * @param item
   * @returns true if the 'Lists portal' element has the lists portal icon.
   */
  checkForEndOfUnorderedList(label: string, item: HTMLLIElement): boolean {
    if (label === 'Lists portal') {
      const span = item.getElementsByTagName('span');
      const img = span[0].innerHTML;
      if (img.indexOf('//upload.wikimedia.org/wikipedia/commons/thumb/2/20/Text-x-generic.svg/') !== -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * If an item is after the "See Also" section,
   * it may have '&#160;&#8211;' in the content.
   * If so, exclude it.
   * @param label
   * @param item
   * @returns true if '&#160;&#8211;' is in the item contents.
   */
  checkForEndOfListItem(label: string, item: HTMLLIElement, type: Types): boolean {
    const innerItem = item.innerHTML;
    if (innerItem.indexOf('&#160;&#8211;') === -1 && type === Types.TableList) {
      this.rejectedAfterSeeAlso++;
      console.log('type ' + type + ' rejected ' + label, item);
      return true;
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
  removeDescriptionFromLabel(item: string) {
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
      newLabel = this.removeDescriptionFromLabel(content);
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
   * Usually the name of item can be gotten from the inner text of an <a> tag inside the table cell.
   * A few however, like 'frequency illusion' are not links, so are just the contents of the <td> tag.
   * Some, such as 'regression bias' have a <span> inside the tag.
   * @param data result of a WikiMedia section API call
   * @returns Array of name/desc objects
   */
  parseList(content: any) {
    const wikipediaList: Item[] = [];
    const one = this.createElementFromHTML(content);
    const tables = one.getElementsByTagName('table');
    loop1: for (let t = 0; t < tables.length; t++) {
      const tableRow = tables[t].getElementsByTagName('tr');
      for (let i = 0; i < tableRow.length; i++) {
        const table = this.getTableDivs(tableRow[i]);
        const tableDiv = tableRow[i].getElementsByTagName('td');
        if (tableDiv.length > 1) {
          const uri = this.getWikipediaUri(tableDiv);
          const desc = this.getWikipediatableDescriptionContent(tableDiv);
          const descriptionWithoutMarkup = this.removeHtml(desc);
          const descriptionWithoutCitations = this.removePotentialCitations(descriptionWithoutMarkup);
          if (desc) {
            const newItem: Item = {
              label: this.getWikipediatableNameContent(tableDiv),
              type: this.getWikipediatableTypeContent(tableDiv),
              description: descriptionWithoutCitations,
              uri
            };
            wikipediaList.push(newItem);
          } else {
            // TODO: Use a better way to find end of list
            break loop1;
          }
        }
      }
    }
    return wikipediaList;
  }

  getWikipediaUri(tableDiv: HTMLCollectionOf<HTMLTableDataCellElement>) {
    const nameAnchor = tableDiv[0].getElementsByTagName('a');
    if (nameAnchor[0]) {
      const uri = nameAnchor[0].getAttribute('href');
      return uri;
    }
  }

  /**
   * Get the string for a name table cell from a Wikipedia page.
   * Usually an anchor with a reference.
   * Sometimes there is no reference meaning there is no single Wikipedia page for this item.
   *
   * These will be used as the key for the object in firebase.
   * Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]".
   * @param tableDiv The <td> tag.
   * @returns string The name field will be used as the item label and should not contain markup or citations.
   */
  getWikipediatableNameContent(tableDiv: HTMLCollectionOf<HTMLTableDataCellElement>) {
    let label;
    const nameAnchor = tableDiv[0].getElementsByTagName('a');
    if (nameAnchor.length > 0) {
      label = tableDiv[0].innerHTML;
    } else {
      label = tableDiv[0].innerHTML;
    }
    label = this.removeHtml(label);
    label = this.removePotentialCitations(label);
    if (label.indexOf('/') !== -1) {
      label = label.replace(' /', ',');
    }
    return label;
  }

  /**
   * The type field of a Wikipedia table name/type/description field could be either:
   * an inner html string,
   * or an anchor tag like this: <a href="/wiki/Prospect_theory" title="Prospect theory">Prospect theory</a>
   * @param tableDiv The <td> tag element.
   * @returns a string with the type.
   */
  getWikipediatableTypeContent(tableDiv: HTMLCollectionOf<HTMLTableDataCellElement>) {
    const stringType = tableDiv[1].innerHTML;
    if (stringType.indexOf('<a') !== -1) {
      const anchorType = tableDiv[1].getElementsByTagName('a');
      const tagInnerText = anchorType[0].innerText;
      return tagInnerText;
    } else {
      return stringType;
    }
  }

  /**
   * Get the description of an item from a <td> element.
   * It could be the second element if the table has only two columns,
   * of the third element if it has three, such as name, type, description.
   * @param tableDiv
   * @param numberOfTableDivs
   * @returns
   */
  getWikipediatableDescriptionContent(tableDiv: HTMLCollectionOf<HTMLTableDataCellElement>) {
    const numberOfTableDivs = 2;
    if (tableDiv[numberOfTableDivs] && typeof tableDiv[numberOfTableDivs].innerHTML !== 'undefined') {
      return tableDiv[numberOfTableDivs].innerHTML;
    } else if (tableDiv[numberOfTableDivs]) {
      return tableDiv[numberOfTableDivs].getElementsByTagName('a')[0].innerHTML;
    } else {
      return tableDiv[1].innerHTML;
    }
  }

  /**
   * @deprecated Unused example wikipedia parsing from the Lorantifolia app.
   * @param tableDiv
   * @returns
   */
  getTableDivs(tableDiv: any) {
    const newItems = [];
    if (typeof tableDiv[0] !== 'undefined') {
      let itemDesc;
      if (typeof tableDiv[1] !== 'undefined') {
        itemDesc = tableDiv[1].innerText;
      }
      let itemName;
      if (typeof tableDiv[0].getElementsByTagName('a')[0] !== 'undefined') {
        itemName = tableDiv[0].getElementsByTagName('a')[0].innerText;
      } else if (typeof tableDiv[0].getElementsByTagName('span')[0] !== 'undefined') {
        itemName = tableDiv[0].getElementsByTagName('span')[0].innerText;
      } else if (typeof tableDiv[0].innerText !== 'undefined') {
        itemName = tableDiv[0].innerText;
      } else {
        console.log('failed to get', tableDiv[0]);
      }
      const backupTitle = this.getAnchorTitleForBackupTitle(tableDiv[0], itemName);
      // itemName = label
      // itemDesc = description
      // backupTitle = wikidataUri?
      const newItem = this.createNewItem(itemName, itemDesc, null, backupTitle);
      newItems.push(newItem);
    }
    return newItems;
  }

  /**
   * Parse the anchor tag for the title of the item used in the tag,
   * which can be different from the name of the item.
   * @param tableDiv the DOM element
   * @param itemName the item name
   */
  getAnchorTitleForBackupTitle(tableDiv: any, itemName: string) {
    if (typeof tableDiv.getElementsByTagName('a')[0] !== 'undefined') {
      const titleProp = tableDiv.getElementsByTagName('a')[0].title;
      let backupLink;
      let backupTitle;
      const href: string = tableDiv.getElementsByTagName('a')[0].href;
      if (href) {
        const slash = href.lastIndexOf('/');
        backupLink = href.substr(slash + 1, href.length);
      }
      if (href.indexOf('index.php') !== -1) {
        backupTitle = -1; // we have a missing detail page
      }
      if (itemName !== titleProp && backupTitle !== -1) {
        backupTitle = titleProp;
      }
      if (
        backupTitle !== null &&
        typeof backupTitle !== 'undefined' &&
        backupTitle !== -1 &&
        backupTitle.indexOf('(psychology)') !== -1
      ) {
        backupTitle = backupTitle.substr(0, backupTitle.indexOf('('));
        // compare the names again without the
        if (backupTitle !== itemName) {
          backupTitle = null;
        }
      }
      if (typeof backupTitle !== 'undefined') {
      }
      return backupTitle;
    } else {
      if (typeof tableDiv.getElementsByTagName('td')[0] !== 'undefined') {
        return tableDiv.getElementsByTagName('td')[0].innerText();
      }
    }
  }

  /**
   * Remove the [edit] portion of the title.
   * @param HTMLDivElement
   */
  parseTitle(html: HTMLDivElement) {
    let title = html.getElementsByTagName('h2')[0].innerText;
    const bracket = title.indexOf('[');
    if (bracket > 0) {
      title = title.substr(0, bracket);
    }
    return title;
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
   * TODO:  Why isn't this being used?  I think the getAllItemsFromWikidataEndpoint()
   * took it's place, in which case delete this if it's not useful.
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
