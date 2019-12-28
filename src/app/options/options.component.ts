import { LoadingController, Platform } from '@ionic/angular';
import { Component, OnInit,  } from '@angular/core';
import { environment } from '@env/environment';
import { I18nService } from '@app/core';
import { FormsModule } from '@angular/forms';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss']
})
export class OptionsComponent implements OnInit {
  version: string | null = environment.version;

  constructor(private i18nService: I18nService,
    private platform: Platform,) {}

  ngOnInit() {}

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
