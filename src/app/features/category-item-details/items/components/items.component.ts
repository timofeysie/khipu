import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Item } from '@app/core/interfaces/item';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export class ItemsComponent implements OnInit {
  @Input() item: Item;
  @Input() categoryName: string;
  @Output() selectedItem = new EventEmitter<Item>();

  constructor(private router: Router) {}

  ngOnInit() {}

  gotoItemDetails(item: Item) {
    const itemUri = item.uri;
    const lastSlash = itemUri.lastIndexOf('/');
    const qCode = itemUri.substring(lastSlash + 1, itemUri.length);
    this.selectedItem.emit(item);
    this.router.navigate([`/categories/item-details/${this.categoryName}/${qCode}`]);
  }
}
