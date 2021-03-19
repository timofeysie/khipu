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

  constructor() {}

  ngOnInit() {}

  gotoItemDetails(item: Item) {
    this.selectedItem.emit(item);
  }
}
