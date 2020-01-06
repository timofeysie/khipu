import { Injectable } from '@angular/core';
import { Store } from '@app/store';
import { CategoriesState } from './categories-store-state';
import { environment, categoriesList } from '@env/environment';

@Injectable()
export class CategoriesStore extends Store<CategoriesState> {
  constructor() {
    super(new CategoriesState());
  }

  fetchList() {
    console.log(categoriesList);
    this.state.categories = categoriesList;
  }
}
