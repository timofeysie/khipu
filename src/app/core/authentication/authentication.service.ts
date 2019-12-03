import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Credentials, CredentialsService } from './credentials.service';
import { Plugins } from '@capacitor/core';

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
  login(context: LoginContext): Observable<Credentials> {
    // Replace by proper authentication call
    const data = {
      username: context.username,
      token: '123456'
    };
    this.credentialsService.setCredentials(data, context.remember);
    return of(data);
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
    // Customize credentials invalidation here
    this.credentialsService.setCredentials();
    return of(true);
  }
}
