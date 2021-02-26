import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Category } from '@app/core/interfaces/categories';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss']
})
export class AddCategoryComponent implements OnInit {
  @Input() categoryAddForm: FormGroup;
  @Output() onPerformSave = new EventEmitter();
  @Output() onPerformLoad = new EventEmitter();
  constructor(private router: Router) {}

  ngOnInit() {}

  performLoad() {
    const category: Category = { ...this.categoryAddForm.value };
    this.onPerformLoad.emit(category);
  }

  performSave() {
    const category: Category = { ...this.categoryAddForm.value };
    // this.categoryAddForm.reset();
    this.onPerformSave.emit(category);
    // this.router.navigateByUrl('/options');
  }
}
