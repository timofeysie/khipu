import { Component, OnInit } from '@angular/core';
import { ItemsStore } from '../items.store';
import { ActivatedRoute } from '@angular/router';
import { Category } from '@app/core/interfaces/categories';
import { Item } from '@app/core/interfaces/item';

@Component({
  selector: 'app-items-container',
  templateUrl: './items-container.component.html',
  styleUrls: ['./items-container.component.scss'],
  providers: [ItemsStore]
})
export class ItemsContainerComponent implements OnInit {
  category: Category;
  constructor(public store: ItemsStore, private activatedRoute: ActivatedRoute) {
    this.activatedRoute.params.subscribe((category: Category) => {
      this.category = category;
      // this.store.fetchList(category, this.store.state.currentPage);

      this.store.fetchList(category, this.store.state.currentPage);
    });
  }

  onSelectedItem(item: Item) {
    this.store.state.selectedItem = item;
  }

  ngOnInit() {}
}
