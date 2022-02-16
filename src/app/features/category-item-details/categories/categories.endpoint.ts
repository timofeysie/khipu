import { Injectable } from '@angular/core';
import * as categories from '../../../../assets/categories.json';
import { Observable } from 'rxjs';
import { Category } from '@app/core/interfaces/categories';

@Injectable()
export class CategoriesEndpoint {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem('categories')) {
      localStorage.setItem('categories', JSON.stringify(categories));
    }
  }

  fetchList(): Observable<any> {
    let response: Observable<any> = new Observable(observer => {
      let localCategories = JSON.parse(localStorage.getItem('categories'));
      observer.next(localCategories);
    });
    return response;
  }

  addCategory(category: Category) {
    let categories = JSON.parse(localStorage.getItem('categories'));
    categories.push(category);
    localStorage.setItem('categories', JSON.stringify(categories));
  }
}
