import { Component, OnInit } from '@angular/core';
import { categoriesList } from '@env/environment';
import { ItemDetailsStore } from '../../item-details-store';

@Component({
  selector: 'app-categories',
  templateUrl: './item-details-container.component.html',
  styleUrls: ['./item-details-container.component.scss'],
  providers: [ItemDetailsStore]
})
export class ItemDetailsContainerComponent implements OnInit {
  constructor(public store: ItemDetailsStore) {}

  ngOnInit() {
    // this.store.fetchList();
    console.log(' this.store', this.store);
  }
}
