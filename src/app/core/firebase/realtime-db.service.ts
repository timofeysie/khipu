import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import 'firebase/database';
import { Logger } from '../logger.service';
import { Category } from '@app/core/interfaces/categories';

const log = new Logger('RealtimeDbService');

@Injectable()
export class RealtimeDbService {
  userId: string;
  constructor() {}

  /**
   * TODO:  How to handle errors with the firebase functions?
   * https://firebase.google.com/docs/database/web/read-and-write?authuser=0#add_a_completion_callback
   * The "Add a Completion Callback" section seems like the answer.
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
      .ref('categories/' + this.userId)
      .set(categoriesToWrite, error => {
        if (error) {
          log.error('write failed', error);
        } else {
          log.debug('write successful');
        }
      });
  }

  readUserData(name: string) {
    this.setupFirebase();
    return firebase
      .database()
      .ref(name + '/' + this.userId)
      .once('value')
      .then(snapshot => {
        return snapshot.val();
      });
  }

  writeDescription(detail: any) {
    this.setupFirebase();
    const database = firebase.database();
    firebase
      .database()
      .ref('items/' + this.userId + '/details/' + detail.query.normalized.fromencoded)
      .set(detail, error => {
        if (error) {
          log.error('write failed', error);
        } else {
          log.debug('write successful');
        }
      });
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
      this.userId = firebase.auth().currentUser.uid;
    } else {
    }
  }
}
