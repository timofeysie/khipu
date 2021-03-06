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
  userId: string;
  constructor() {
    this.setupFirebase();
  }

  /**
   * TODO:  How to handle errors with the firebase functions?
   * https://firebase.google.com/docs/database/web/read-and-write?authuser=0#add_a_completion_callback
   * The "Add a Completion Callback" section seems like the answer.
   * @param categories JSON category object.
   */
  writeCategories(categories: Category[]) {
    const userId = this.setupFirebase();
    const categoriesToWrite = {};
    categories.forEach(category => {
      categoriesToWrite[category.name] = category;
    });
    if (!userId) {
      log.error('1. caught trying to use an undefined user in categories');
    } else {
      firebase
        .database()
        .ref('categories/' + userId)
        .set(categoriesToWrite, error => {
          if (error) {
            log.error('2. write failed', error);
          } else {
            log.debug('3. write successful1', categoriesToWrite);
          }
        });
    }
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
    let userId = this.setupFirebase();
    if (!userId) {
      userId = firebase.auth().currentUser.uid;
    }
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
            'user-description': item.description ? item.description : '',
            'user-description-viewed-count': 0,
            'item-details-viewed-count': 0,
            'item-details-viewed-date': new Date().getTime(),
            uri: item.uri ? item.uri : '',
            wikidataUri: item.wikidataUri ? item.wikidataUri : ''
          };
          currentItems[item.label] = newItem;
        });
        const pathToData = 'items/' + userId + '/' + category;
        if (pathToData.indexOf('undefined') !== -1) {
          log.error('4. undefined in path to data', pathToData);
        } else {
          firebase
            .database()
            .ref(pathToData)
            .set(currentItems, error => {
              if (error) {
                log.error('5. write failed', error);
              } else {
                log.debug('6. write successful2');
              }
            });
        }
      })
      .catch(error => {
        // list doesn't exist yet?
        log.error('7. error', error);
      });
  }

  writeNewItemList(newItems: Item[], category: string) {
    let userId = this.setupFirebase();
    if (!userId) {
      userId = firebase.auth().currentUser.uid;
    }
    const currentItems = {};
    newItems.forEach((item: any) => {
      // check if the item already exists?
      // if it doesn't, created a new default user description and counts
      // maybe the description should be set as the item description?
      const newItem = {
        'user-description': item.description ? item.description : '',
        'user-description-viewed-count': 0,
        'item-details-viewed-count': 0,
        'item-details-viewed-date': new Date().getTime(),
        uri: item.uri ? item.uri : '',
        wikidataUri: item.wikidataUri ? item.wikidataUri : ''
      };
      currentItems[item.label] = newItem;
    });
    const pathToData = 'items/' + userId + '/' + category;
    if (pathToData.indexOf('undefined') !== -1) {
      log.error('8. undefined in path to data', pathToData);
    } else {
      firebase
        .database()
        .ref(pathToData)
        .set(currentItems, error => {
          if (error) {
            log.error('9. write failed', error);
          } else {
            log.debug('10. write successful2');
          }
        });
    }
  }

  readUserData(name: string) {
    let userId = this.setupFirebase();
    if (!userId) {
      if (firebase.auth().currentUser) {
        userId = firebase.auth().currentUser.uid;
      }
    }
    return firebase
      .database()
      .ref(name + '/' + userId)
      .once('value')
      .then(snapshot => {
        return snapshot.val();
      })
      .catch(error => {
        log.error('11. error', error);
      });
  }

  async readUserSubData(name: string, sub: string) {
    let userId = this.setupFirebase();
    if (!userId) {
      if (firebase.auth().currentUser) {
        userId = firebase.auth().currentUser.uid;
      }
    }
    const path = name + '/' + userId + '/' + sub;
    log.debug('12. path', path);
    return firebase
      .database()
      .ref(path)
      .once('value')
      .then(snapshot => {
        return snapshot.val();
      })
      .catch(error => {
        log.error('13. error', error);
      });
  }

  /**
   *
   * @param tableName items
   * @param category category
   * @param itemName label
   * @returns
   */
  readUserSubDataItem(tableName: string, category: string, itemName: string) {
    return new Promise((resolve, reject) => {
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          const database = firebase.database();
        }
        const userId = firebase.auth().currentUser.uid;
        const routeToData = tableName + '/' + userId + '/' + category + '/' + itemName;
        log.debug('14. routeToData', routeToData);
        firebase
          .database()
          .ref(routeToData)
          .once('value')
          .then(snapshot => {
            resolve(snapshot.val());
          })
          .catch(error => {
            log.error('15. error', error);
            reject(error);
          });
      });
    });
  }

  writeDescription(description: any, itemLabel: string, category: string) {
    let userId = this.setupFirebase();
    if (!userId) {
      userId = firebase.auth().currentUser.uid;
    }
    const pathToData = 'items/' + userId + '/' + category + '/' + itemLabel + '/user-description';
    if (pathToData.indexOf('undefined') !== -1) {
      log.error('16. catching undefined', pathToData);
    } else {
      firebase
        .database()
        .ref(pathToData)
        .set(description, error => {
          if (error) {
            log.error('17. write failed', error);
          } else {
            log.debug('18. write successful3', description);
          }
        });
    }
  }

  setupFirebase(): any {
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
      if (this.userId) {
        return this.userId;
      } else {
        if (firebase.auth().currentUser) {
          const id = firebase.auth().currentUser.uid;
          if (id) {
            this.userId = id;
            return id;
          } else {
            return firebase.auth().currentUser.uid;
          }
        }
      }
    });
  }

  async setupFirebaseAsync() {
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
      return firebase.auth().currentUser.uid;
    });
  }
}
