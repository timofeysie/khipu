import { Injectable } from '@angular/core';
import { Store } from '@app/store';
import { RealtimeDbService } from '@app/core/firebase/realtime-db.service';
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
    forkJoin(this.getItemsFromWikidataEndpoint(newCategory, currentPage))
      .pipe(
        map(async wikidataItemList => {
          console.log('wikidataItemList', wikidataItemList);
        })
      )
      .subscribe();
  }

  /**
   * Replacement for getItemsFromEndpoint()
   * @param category
   * @param currentPage
   */
  getItemsFromWikidataEndpoint(category: Category, currentPage: number): Observable<any> {
    return this.itemListEndpoint.listItems(category, currentPage);
  }
}
