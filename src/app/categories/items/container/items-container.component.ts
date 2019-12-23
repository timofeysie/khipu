import { Component, OnInit } from '@angular/core';
import { ItemsStore } from '../items.store';
import { ActivatedRoute } from '@angular/router';
<<<<<<< HEAD
=======
import { Category } from '@app/core/interfaces/categories';
>>>>>>> e043ee3bf7588420ccf7530fffac1d07a77291f9

@Component({
  selector: 'app-items-container',
  templateUrl: './items-container.component.html',
  styleUrls: ['./items-container.component.scss'],
  providers: [ItemsStore]
})
export class ItemsContainerComponent implements OnInit {
<<<<<<< HEAD
  constructor(private store: ItemsStore, private activeRoute: ActivatedRoute) {}

  ngOnInit() {
    console.log(this.activeRoute.queryParams);
  }
=======
  constructor(private store: ItemsStore, private activatedRoute: ActivatedRoute) {
    this.activatedRoute.params.subscribe((category: Category) => console.log(category));
  }

  ngOnInit() {}
>>>>>>> e043ee3bf7588420ccf7530fffac1d07a77291f9
}
