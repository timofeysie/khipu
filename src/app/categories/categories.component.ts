import { Component, OnInit } from '@angular/core';
import { categoriesList } from '@env/environment';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  categoriesList = categoriesList;
  constructor() {}

  ngOnInit() {}
}
