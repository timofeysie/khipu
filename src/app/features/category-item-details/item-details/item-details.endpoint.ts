import { Injectable } from '@angular/core';
import * as categories from '../../../../assets/categories.json';
import { Observable } from 'rxjs';
import { ItemDetails } from '@app/core/interfaces/item-details.js';

@Injectable()
export class ItemDetailsEndpoint {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem('itemDetails')) {
      localStorage.setItem('itemDetails', JSON.stringify(categories));
    }
  }

  fetchDetails(qcode: string, language: string): Observable<any> {
    let response: Observable<any> = new Observable(observer => {
      let localItemDetails = JSON.parse(localStorage.getItem('categories'));
      observer.next(localItemDetails);
    });
    return response;
  }

  addItemDetails(itemDetail: ItemDetails) {
    let itemDetails = JSON.parse(localStorage.getItem('itemDetails'));
    categories.push(itemDetails);
    localStorage.setItem('itemDetails', JSON.stringify(itemDetails));
  }
}
