import { Injectable } from '@angular/core';
import { Store } from '@app/store';
import { CategoriesState } from './categories-store-state';
import { CategoriesEndpoint } from './categories.endpoint';
import { Category } from '@app/core/interfaces/categories';
import { map } from 'rxjs/operators';

@Injectable()
export class CategoriesStore extends Store<CategoriesState> {
  constructor(private categoriesEndpoint: CategoriesEndpoint) {
    super(new CategoriesState());
    this.fetchList();
  }

  fetchList() {
    this.categoriesEndpoint
      .fetchList()
      .pipe(
        map((rawCategoryList: Category[]) => {
          const lst: Category[] = rawCategoryList.map(rawCategory => {
            const category: Category = { ...rawCategory };
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
