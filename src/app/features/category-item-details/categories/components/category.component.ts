import { Component, OnInit, Input } from '@angular/core';
import { Category } from '@app/core/interfaces/categories';

@Component({
  selector: 'categories-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {
  @Input() category: Category;

  constructor() {}

  ngOnInit() {
    console.log(this.category);
  }
}
