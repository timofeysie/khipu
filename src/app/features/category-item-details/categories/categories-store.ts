import { Injectable } from '@angular/core';
import { Store } from '@app/store';
import { CategoriesState } from './categories-store-state';
import { CategoriesEndpoint } from './categories.endpoint';
import { Category } from '@app/core/interfaces/categories';
import { map } from 'rxjs/operators';
import { I18nService } from '@app/core';
import { environment } from '@env/environment.prod';

@Injectable()
export class CategoriesStore extends Store<CategoriesState> {
  constructor(private categoriesEndpoint: CategoriesEndpoint, private i18nService: I18nService) {
    super(new CategoriesState());
    this.fetchList();
  }

  fetchList() {
    const currentLanguage = this.i18nService.language;
    const sparqlLanguages = environment.sparqlLanguages;
    const sparqlLanguageObject = sparqlLanguages.find(i => i.appLanguage === currentLanguage);
    this.categoriesEndpoint
      .fetchList()
      .pipe(
        map((rawCategoryList: Category[]) => {
          const lst: Category[] = rawCategoryList.map(rawCategory => {
            const category: Category = { ...rawCategory, language: sparqlLanguageObject.sparqlLanguage };
            return category;
          });
          return lst;
        })
      )
      .subscribe((categoriesFromEndpoint: Category[]) => {
        this.state.categories = categoriesFromEndpoint;
      });
  }

  saveNewCategory(newCategory: Category) {
    this.setState({ ...this.state, categories: [newCategory] });
    this.categoriesEndpoint.addCategory(newCategory);
  }
}
