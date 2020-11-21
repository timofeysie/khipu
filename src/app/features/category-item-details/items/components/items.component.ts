import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Item } from '../items.store.state';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export class ItemsComponent implements OnInit {
  @Input() item: Item;
  @Input() categoryName: string;

  constructor(private router: Router) {}

  ngOnInit() {}

  gotoItemDetails(itemUri: string) {
    const lastSlash = itemUri.lastIndexOf('/');
    const qCode = itemUri.substring(lastSlash + 1, itemUri.length);
    this.router.navigate([`/categories/item-details/${this.categoryName}/${qCode}`]);
  }
}
