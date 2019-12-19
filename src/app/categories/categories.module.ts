import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { CategoriesRoutingModule } from './categories-routing.module';
import { CategoriesComponent } from './categories.component';
import { ItemsContainerComponent } from './items/container/items-container.component';
import { ItemsComponent } from './items/components/items.component';

@NgModule({
  imports: [CommonModule, TranslateModule, IonicModule, CategoriesRoutingModule],
  entryComponents: [CategoriesComponent],
  declarations: [CategoriesComponent, ItemsContainerComponent, ItemsComponent]
})
export class CategoriesModule {}
