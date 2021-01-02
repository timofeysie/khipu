import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import 'firebase/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Logger } from '../logger.service';
import { Category } from '@app/core/interfaces/categories';
import { Item } from '@app/core/interfaces/item';
import { Subscription } from 'rxjs';

const log = new Logger('RealtimeDbService');

@Injectable()
export class RealtimeDbService {
  authSubscription: Subscription;
  constructor() {}

  /**
   * TODO:  How to handle errors with the firebase functions?
   * https://firebase.google.com/docs/database/web/read-and-write?authuser=0#add_a_completion_callback
   * The "Add a Completion Callback" section seems like the answer.
   * @param categories JSON category object.
   */
  writeCategories(categories: Category[]) {
    this.setupFirebase();
    const userId = firebase.auth().currentUser.uid;
    const categoriesToWrite = {};
    categories.forEach(category => {
      categoriesToWrite[category.name] = category;
    });
    firebase
      .database()
      .ref('categories/' + userId)
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
  writeItemsList(newItems: Item[], category: string) {
    this.setupFirebase();
    const userId = firebase.auth().currentUser.uid;
    // load the current items list
    this.readUserSubData('items', category)
      .then((currentItems: any) => {
        if (!currentItems) {
          currentItems = {};
        }
        // current items are the existing
        newItems.forEach((item: any) => {
          // check if the item already exists?
          // if it doesn't, created a new default user description and counts
          // maybe the description should be set as the item description?
          const newItem = {
            'user-description': item.description,
            'user-description-viewed-count': 0,
            'item-details-viewed-count': 0,
            'item-details-viewed-date': new Date().getMilliseconds()
          };
          currentItems[item.label] = newItem;
        });
        firebase
          .database()
          .ref('items/' + userId + '/' + category)
          .set(currentItems, error => {
            if (error) {
              log.error('write failed', error);
            } else {
              log.debug('write successful');
            }
          });
      })
      .catch(error => {
        // list doesn't exist yet?
        log.error('error', error);
      });
  }

  readUserData(name: string) {
    this.setupFirebase();
    const userId = firebase.auth().currentUser.uid;
    return firebase
      .database()
      .ref(name + '/' + userId)
      .once('value')
      .then(snapshot => {
        return snapshot.val();
      })
      .catch(error => {
        log.error('error', error);
      });
  }

  readUserSubData(name: string, sub: string) {
    this.setupFirebase();
    const userId = firebase.auth().currentUser.uid;
    return firebase
      .database()
      .ref(name + '/' + userId + '/' + sub)
      .once('value')
      .then(snapshot => {
        return snapshot.val();
      })
      .catch(error => {
        log.error('error', error);
      });
  }

  writeDescription(detail: any) {
    this.setupFirebase();
    const userId = firebase.auth().currentUser.uid;
    firebase
      .database()
      .ref('items/' + userId + '/details/' + detail.query.normalized.fromencoded)
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
    }
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        const database = firebase.database();
      }
    });
  }
}
