import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Category } from '@app/core/interfaces/categories';
import { Item } from '@app/core/interfaces/item';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss']
})
export class AddCategoryComponent implements OnInit {
  @Input() categoryAddForm: FormGroup;
  @Input() wikidataItemList: Category[];
  @Input() wikiListItems: Item[];

  @Output() onPerformSave = new EventEmitter();
  @Output() onPerformLoad = new EventEmitter();
  category: Category;
  wikidataToggle: boolean;
  wikiListItemsToggle: boolean;
  constructor(private router: Router) {}

  ngOnInit() {}

  performLoad() {
    this.category = { ...this.categoryAddForm.value };
    this.onPerformLoad.emit(this.category);
  }

  onWikidataToggle() {
    this.wikidataToggle = !this.wikidataToggle;
  }

  onWikiListItemsToggle() {
    this.wikiListItemsToggle = !this.wikiListItemsToggle;
  }

  performSave() {
    const category: Category = { ...this.categoryAddForm.value };
    // this.categoryAddForm.reset();
    this.onPerformSave.emit(category);
    // this.router.navigateByUrl('/options');
    console.log('save disabled');
  }
}
