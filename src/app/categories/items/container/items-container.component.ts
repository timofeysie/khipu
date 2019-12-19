import { Component, OnInit } from '@angular/core';
import { ItemsStore } from '../items.store';

@Component({
  selector: 'app-items-container',
  templateUrl: './items-container.component.html',
  styleUrls: ['./items-container.component.scss'],
  providers: [ItemsStore]
})
export class ItemsContainerComponent implements OnInit {
  constructor(private store: ItemsStore) {}

  ngOnInit() {}
}
