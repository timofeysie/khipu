import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Category } from '@app/core/interfaces/categories';
import { Item } from '@app/core/interfaces/item';
import { CategoriesStore } from '../../categories-store';
import * as categories from '../../../../assets/categories.json';

@Component({
  selector: 'app-add-category-container',
  templateUrl: './add-category-container.component.html',
  styleUrls: ['./add-category-container.component.scss'],
  providers: [CategoriesStore]
})
export class AddCategoryContainerComponent implements OnInit {
  // TODO Use a selector to offer popular category settings pre-filling the form.
  // See Issue #51.
  categoryForm = new FormGroup({
    categoryName: new FormControl('fallacies'),
    label: new FormControl('Fallacies'),
    language: new FormControl('en'),
    wdt: new FormControl('P31'),
    wd: new FormControl('Q186150')
  });
  wikidataItemList: Category[];
  wikiListItems: Item[];
  localCategories: any;
  default = 'Fallacies';
  selectedPrefill: any;

  constructor(public store: CategoriesStore) {
    this.localCategories = JSON.parse(localStorage.getItem('categories'));
  }

  ngOnInit() {
    this.store.state$.subscribe(state => {
      this.wikidataItemList = state.wikidataItemList;
      this.wikiListItems = state.wikiListItems;
    });
    setTimeout(() => {
      this.default = 'Fallacies';
      this.selectedPrefill = this.localCategories[0];
    }, 1600);
  }

  loadNewCategory(event: any) {
    this.store.loadNewCategory(event);
  }

  updateDefault(event: any) {
    this.default = event.detail.value;
    for (const prop in this.localCategories) {
      if (this.localCategories[prop].label === this.default) {
        this.selectedPrefill = this.localCategories[prop];
        this.setForm();
      }
    }
  }

  setForm() {
    this.categoryForm.setValue({
      categoryName: this.selectedPrefill.name,
      label: this.selectedPrefill.label,
      language: this.selectedPrefill.language,
      wdt: this.selectedPrefill.wdt,
      wd: this.selectedPrefill.wd
    });
  }
}
