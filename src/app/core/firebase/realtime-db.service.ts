import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import 'firebase/database';
import { Logger } from '../logger.service';
import { Category } from '@app/core/interfaces/categories';
import { Item } from '@app/core/interfaces/item';

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

  /**
   * Right now we are using the item label as the key in this list,
   * it might be better to use the "from" value (see below)
   * if that's a unique value that is converted into a human readable label.
   * "Fallacy of composition": {
   *    "batchcomplete": true,
   *      "query": {
   *        "normalized": [{
   *          "fromencoded": false,
   *          "from": "Fallacy_of_composition",
   *          "to": "Fallacy of composition"
   *        }
   *        ...
   * @param items List of items to store.
   */
  writeItemsList(items: Item[]) {
    this.setupFirebase();
    let itemsToWrite = {};
    items.forEach(item => {
      itemsToWrite[item.label] = item;
    });
    firebase
      .database()
      .ref('items/' + this.userId)
      .set(itemsToWrite, error => {
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
      })
      .catch(error => {
        console.log('error', error);
      });
  }

  writeDescription(detail: any) {
    this.setupFirebase();
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
      const database = firebase.database();
      this.userId = firebase.auth().currentUser.uid;
      console.log('1 this.userId', this.userId);
    } else {
      const database = firebase.database();
      this.userId = firebase.auth().currentUser.uid;
      console.log('2 this.userId', this.userId);
    }
  }
}
