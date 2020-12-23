import { Component, OnInit, OnDestroy } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LoadingController, Platform } from '@ionic/angular';
import { map } from 'rxjs/operators';
import { forkJoin, from } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '@env/environment';
import { Logger, I18nService, AuthenticationService, untilDestroyed } from '@app/core';

const log = new Logger('Login');

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  version: string | null = environment.version;
  error: string | undefined;
  loginForm!: FormGroup;
  isLoading = false;
  updateChecked = false;
  updateAvailable = false;
  get waitingForUpdates() {
    return !this.updateChecked || this.updateAvailable;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private platform: Platform,
    private loadingController: LoadingController,
    private i18nService: I18nService,
    private authenticationService: AuthenticationService,
    private updates: SwUpdate
  ) {
    this.createForm();
  }

  async ngOnInit() {
    // Check for new version and update if available
    this.updates.available.subscribe(() => {
      this.updateAvailable = true;
      log.debug('updateAvailable', this.updateAvailable);
      window.location.reload();
    });
    if (this.updates.isEnabled) {
      await this.updates.checkForUpdate();
    } else {
      log.debug('Service worker updates are disabled.');
    }
    this.updateChecked = true;
  }

  ngOnDestroy() {}

  async b2cLogin() {
    const login$ = this.authenticationService.b2cLogin(this.loginForm.value);
  }

  async login() {
    this.isLoading = true;
    const login$ = this.authenticationService.login(this.loginForm.value);
    const loadingOverlay = await this.loadingController.create({});
    const loading$ = from(loadingOverlay.present());
    forkJoin([login$, loading$])
      .pipe(
        map(([credentials, ...rest]) => credentials),
        finalize(() => {
          this.loginForm.markAsPristine();
          this.isLoading = false;
          loadingOverlay.dismiss();
        }),
        untilDestroyed(this)
      )
      .subscribe(
        credentials => {
          this.router.navigate([this.route.snapshot.queryParams.redirect || '/'], { replaceUrl: true });
        },
        error => {
          log.debug(`Login error: ${error}`);
          this.error = error;
        }
      );
  }

  setLanguage(language: string) {
    this.i18nService.language = language;
  }

  get currentLanguage(): string {
    return this.i18nService.language;
  }

  get languages(): string[] {
    return this.i18nService.supportedLanguages;
  }

  get isWeb(): boolean {
    return !this.platform.is('cordova');
  }

  private createForm() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      remember: true
    });
  }
}
