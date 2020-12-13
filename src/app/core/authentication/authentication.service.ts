import { Injectable, NO_ERRORS_SCHEMA } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Credentials, CredentialsService } from './credentials.service';
import { Plugins } from '@capacitor/core';
import firebase from 'firebase/app';
import 'firebase/auth';

export interface LoginContext {
  username: string;
  password: string;
  remember?: boolean;
}

/**
 * Provides a base for authentication workflow.
 * The login/logout methods should be replaced with proper implementation.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  constructor(private credentialsService: CredentialsService) {}

  /**
   * Authenticates the user.
   * @param context The login parameters.
   * @return The user credentials.
   */
  login(context: LoginContext): Observable<Credentials> | any {
    this.setupFirebase();
    return firebase
      .auth()
      .signInWithEmailAndPassword(context.username, context.password)
      .then((result: any) => {
        const data = {
          username: context.username,
          token: result.user.uid
        };
        this.credentialsService.setCredentials(data, context.remember);
        return result;
      })
      .catch((error: any) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        return of(errorCode + ' ', errorMessage) as Observable<any>;
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
      console.log('firebase initiated');
      firebase.initializeApp(firebaseConfig);
    }
    return firebaseConfig;
  }

  b2cLogin(context: LoginContext) {
    const testURI = `https://khipub2c.b2clogin.com/khipub2c.onmicrosoft.com/oauth2/v2.0/authorize?
      p=B2C_1_signupsignin1
      &client_id=a40400a8-48a8-486b-936c-99aeba95a1e7
      &nonce=defaultNonce
      &redirect_uri=https%3A%2F%2Fjwt.ms
      &scope=openid
      &response_type=id_token
      &prompt=login`.replace(/ /g, '');
    Plugins.Browser.open({ url: testURI });
    Plugins.Browser.addListener('browserFinished', (info: any) => {
      console.log('browserFinished');
    });
  }

  /**
   * Logs out the user and clear credentials.
   * @return True if the user was logged out successfully.
   */
  logout(): Observable<boolean> {
    this.setupFirebase();
    this.credentialsService.setCredentials();
    firebase
      .auth()
      .signOut()
      .then(
        () => {
          console.log('Signed Out');
        },
        error => {
          console.error('Sign Out Error', error);
        }
      );
    return of(true);
  }
}
