import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Category } from '@app/core/interfaces/categories';
import { CategoriesStore } from '../../categories-store';

@Component({
  selector: 'app-add-category-container',
  templateUrl: './add-category-container.component.html',
  styleUrls: ['./add-category-container.component.scss'],
  providers: [CategoriesStore]
})
export class AddCategoryContainerComponent implements OnInit {
  categoryForm = new FormGroup({
    categoryName: new FormControl('fallacies'),
    label: new FormControl('Fallacies'),
    language: new FormControl('en'),
    wdt: new FormControl('P31'),
    wd: new FormControl('Q186150')
  });
  constructor(public store: CategoriesStore) {}

  ngOnInit() {}

  loadNewCategory(event: any) {
    this.store.loadNewCategory(event);
  }
}
