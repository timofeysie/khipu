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
  constructor(private store: CategoriesStore) {}

  categoryForm = new FormGroup({
    categoryName: new FormControl(''),
    label: new FormControl(''),
    language: new FormControl(''),
    wdt: new FormControl(''),
    wd: new FormControl('')
  });

  ngOnInit() {}
}
