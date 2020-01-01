import { Component, OnInit, Input } from '@angular/core';
import { Item } from '../items.store.state';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export class ItemsComponent implements OnInit {
  @Input() item: Item;

  constructor() {}

  ngOnInit() {}
}
