import { Injectable } from '@angular/core';
import * as categories from '../../../../assets/categories.json';
import { Observable } from 'rxjs';
import { Category } from '@app/core/interfaces/categories.js';

@Injectable()
export class CategoriesEndpoint {
  init() {
    if (!localStorage.getItem('categories')) {
      localStorage.setItem('categories', JSON.stringify(categories));
    }
  }

  constructor() {
    this.init();
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
