import { Injectable, NO_ERRORS_SCHEMA } from '@angular/core';
import { Observable, of } from 'rxjs';
import { RealtimeDbService } from '@app/core/firebase/realtime-db.service';
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
  constructor(private credentialsService: CredentialsService, private realtimeDbService: RealtimeDbService) {}

  /**
   * Authenticates the user.
   * @param context The login parameters.
   * @return The user credentials.
   */
  login(context: LoginContext): Observable<Credentials> | any {
    this.realtimeDbService.setupFirebase();
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
        throw new Error(error.message);
      });
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
    this.realtimeDbService.setupFirebase();
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
