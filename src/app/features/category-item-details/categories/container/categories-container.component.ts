import { Component, OnInit } from '@angular/core';
import { categoriesList } from '@env/environment';
import { CategoriesStore } from '../categories-store';

@Component({
  selector: 'app-categories',
  templateUrl: './categories-container.component.html',
  styleUrls: ['./categories-container.component.scss'],
  providers: [CategoriesStore]
})
export class CategoriesContainerComponent implements OnInit {
  constructor(public store: CategoriesStore) {}

  ngOnInit() {
    console.log(this.store.fetchList());
  }
}
