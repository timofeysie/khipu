import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import 'firebase/database';
import { Category } from '@app/core/interfaces/categories';

@Injectable()
export class RealtimeDbService {
  constructor() {}

  getUserId() {
    this.setupFirebase();
    const userId = firebase.auth().currentUser.uid;
    console.log('userId', userId);
    return userId;
  }

  /**
   * TODO:  How to handle errors with the firebase functions?
   * @param categories JSON category object.
   */
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

  writeDescription(detail: any) {
    this.setupFirebase();
    const database = firebase.database();
    firebase
      .database()
      .ref('items/details/' + detail.query.normalized.fromencoded)
      .set(detail);
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
      firebase.initializeApp(firebaseConfig);
    }
  }
}
