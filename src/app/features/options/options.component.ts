import { LoadingController, Platform } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { environment } from '@env/environment';
import { I18nService } from '@app/core';
import { CheckForUpdateService } from './services/sw/check-for-update.service';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss']
})
export class OptionsComponent implements OnInit {
  version: string | null = environment.version;
  updateCheckText = '';

  constructor(private i18nService: I18nService, private platform: Platform, private update: SwUpdate) {}

  ngOnInit() {}

  updateCheck(): void {
    this.update
      .checkForUpdate()
      .then(() => (this.updateCheckText = 'resolved'))
      .catch(err => (this.updateCheckText = `rejected: ${err.message}`));
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
}
