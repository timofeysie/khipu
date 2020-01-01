import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OptionsRoutingModule } from './options-routing.module';
import { OptionsComponent } from './options.component';
// sw-imports
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../../../environments/environment';
import { CheckForUpdateService } from './services/sw/check-for-update.service';
import { LogUpdateService } from './services/sw/log-update.service';
import { PromptUpdateService } from './services/sw/prompt-update.service';

@NgModule({
  imports: [CommonModule, TranslateModule, IonicModule, OptionsRoutingModule, FormsModule, ReactiveFormsModule],
  entryComponents: [OptionsComponent],
  declarations: [OptionsComponent]
})
export class OptionsModule {}
