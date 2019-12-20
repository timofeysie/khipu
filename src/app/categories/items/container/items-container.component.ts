import { Component, OnInit } from '@angular/core';
import { ItemsStore } from '../items.store';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-items-container',
  templateUrl: './items-container.component.html',
  styleUrls: ['./items-container.component.scss'],
  providers: [ItemsStore]
})
export class ItemsContainerComponent implements OnInit {
  constructor(private store: ItemsStore, private activeRoute: ActivatedRoute) {}

  ngOnInit() {
    console.log(this.activeRoute.queryParams);
  }
}
