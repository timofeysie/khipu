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

  saveNewCategory(newCategory: Category) {
    console.log('save disabled');
    // this.setState({ ...this.state, categories: [newCategory] });
    // this.categoriesEndpoint.addCategory(newCategory);
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
    const category = desc[0].getElementsByClassName('mw-headline')[0].innerText;
    const allDesc = desc[2];
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
      const numberOfItems = li.length;
      for (let j = 0; j < numberOfItems; j++) {
        const item = li[j];
        const liAnchor: HTMLCollection = item.getElementsByTagName('a');
        const label = this.parseAnchorTag(liAnchor);
        const content = item.textContent || item.innerText || '';
        const descriptionWithoutLabel = this.removeLabelFromDescription(content);
        const descWithoutCitations = this.removePotentialCitations(descriptionWithoutLabel);
        if (label !== null) {
          const uri = liAnchor[0].getAttribute('href');
          // create item and add it to the list
          if (label === 'Lists portal') {
            const span = item.getElementsByTagName('span');
            const img = span[0].innerHTML;
            if (img.indexOf('//upload.wikimedia.org/wikipedia/commons/thumb/2/20/Text-x-generic.svg/') !== -1) {
              endOfList = true;
              break;
            }
          }
          const newWikiItem = this.createNewItem(label, descWithoutCitations, uri);
          wikiList.push(newWikiItem);
        } else {
          // skipped - with check if it's by mistake and a different layout that we've seen before.
        }
      }
    }
    return wikiList;
  }

  createNewItem(label: string, description: string, uri: string) {
    const wikiItem: Item = {
      uri,
      label,
      description
    };
    return wikiItem;
  }

  /**
   *
   * @param item string full contents of li tag.
   */
  removeLabelFromDescription(item: string) {
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
    return item.substr(start + increment, end);
  }

  parseAnchorTag(liAnchor: HTMLCollection) {
    const label = liAnchor[0].innerHTML;
    if (label.indexOf('tocnumber') === -1) {
      return label;
    } else {
      return null;
    }
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
