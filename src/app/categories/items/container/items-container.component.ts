import { Component, OnInit } from '@angular/core';
import { ItemsStore } from '../items.store';
import { ActivatedRoute } from '@angular/router';
import { Category } from '@app/core/interfaces/categories';

@Component({
  selector: 'app-items-container',
  templateUrl: './items-container.component.html',
  styleUrls: ['./items-container.component.scss'],
  providers: [ItemsStore]
})
export class ItemsContainerComponent implements OnInit {
  constructor(private store: ItemsStore, private activatedRoute: ActivatedRoute) {
    this.activatedRoute.params.subscribe((category: Category) => this.store.fetchList(category));
  }

  ngOnInit() {}
}
