import { Component, OnInit } from '@angular/core';
import { ItemsStore } from '../items.store';
import { ActivatedRoute, Router } from '@angular/router';
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
  constructor(public store: ItemsStore, private activatedRoute: ActivatedRoute, private router: Router) {
    this.activatedRoute.params.subscribe((category: Category) => {
      this.category = category;
      // this.store.fetchList(category, this.store.state.currentPage);
      this.store.fetchListFromFirebase(category).then(result => {
        const items = [];
        for (let label in result) {
          if (result.hasOwnProperty(label)) {
            const fbItem: Item = {
              label: label,
              description: result[label]['user-description'],
              uri: result[label]['uri'],
              wikidataUri: result[label]['wikidataUri']
            };
            items.push(fbItem);
          }
        }
        this.store.state.items = items;
      });
    });
  }

  onSelectedItem(item: Item) {
    console.log('item', item);
    this.store.state.selectedItem = item;
    if (item.wikidataUri) {
      // wikidata item
      const lastSlash = item.wikidataUri.lastIndexOf('/');
      const qCode = item.wikidataUri.substring(lastSlash + 1, item.wikidataUri.length);
      this.router.navigate([`/categories/item-details/${this.category.name}/${qCode}/${item.label}`]);
    } else {
      // wikipedia item
      this.router.navigate([`/categories/item-details/${this.category.name}/q/${item.label}`]);
    }
  }

  ngOnInit() {}
}
