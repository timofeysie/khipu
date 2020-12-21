import { Injectable } from '@angular/core';
import { Store } from '@app/store';
import firebase from 'firebase/app';
import 'firebase/database';
import { CategoriesState } from './categories-store-state';
import { CategoriesEndpoint } from './categories.endpoint';
import { Category } from '@app/core/interfaces/categories';
import { map } from 'rxjs/operators';
import { I18nService } from '@app/core';
import { environment } from '@env/environment.prod';

@Injectable()
export class CategoriesStore extends Store<CategoriesState> {
  constructor(private categoriesEndpoint: CategoriesEndpoint, private i18nService: I18nService) {
    super(new CategoriesState());
  }

  fetchList() {
    const currentLanguage = this.i18nService.language;
    const sparqlLanguages = environment.sparqlLanguages;
    const sparqlLanguageObject = sparqlLanguages.find(i => i.appLanguage === currentLanguage);
    this.categoriesEndpoint
      .fetchList()
      .pipe(
        map((rawCategoryList: Category[]) => {
          const list: Category[] = rawCategoryList.map(rawCategory => {
            const category: Category = { ...rawCategory, language: sparqlLanguageObject.sparqlLanguage };
            return category;
          });
          console.log('list', list);
          this.writeCategories(list);
          return list;
        })
      )
      .subscribe((categoriesFromEndpoint: Category[]) => {
        this.state.categories = categoriesFromEndpoint;
      });
  }

  saveNewCategory(newCategory: Category) {
    this.setState({ ...this.state, categories: [newCategory] });
    this.categoriesEndpoint.addCategory(newCategory);
  }

  writeCategories(categories: Category[]) {
    this.setupFirebase();
    let categoriesToWrite = {};
    categories.forEach(category => {
      categoriesToWrite[category.name] = category;
    });
    const database = firebase.database();
    firebase
      .database()
      .ref('categories')
      .set(categoriesToWrite);
  }

  setupFirebase() {
    const firebaseConfig = {
      apiKey: 'AIzaSyBDeqGbiib0fVFoc2yWr9WVE4MV6isWQ9Y',
      authDomain: 'khipu1.firebaseapp.com',
      databaseURL: 'https://khipu1.firebaseio.com',
      projectId: 'khipu1',
      storageBucket: 'khipu1.appspot.com',
      messagingSenderId: '348969595626',
      appId: '1:348969595626:web:a3094e5d87583fca551d93'
    };
    if (!firebase.apps.length) {
      console.log('firebase initiated');
      firebase.initializeApp(firebaseConfig);
    } else {
      console.log('firebase already exists');
    }
  }
}
