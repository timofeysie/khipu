import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ThemeRoutingModule } from './theme-routing.module';
import { ThemeComponent } from './theme.component';

@NgModule({
  imports: [CommonModule, TranslateModule, IonicModule, ThemeRoutingModule, FormsModule],
  entryComponents: [ThemeComponent],
  declarations: [ThemeComponent]
})
export class ThemeModule {}
