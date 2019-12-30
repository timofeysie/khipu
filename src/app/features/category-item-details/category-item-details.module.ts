import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { ItemsContainerComponent } from './items/container/items-container.component';
import { ItemsComponent } from './items/components/items.component';
import { ItemsListEndpoint } from './items/items.endpoint';
import { CategoryItemDetailsRoutingModule } from './category-item-details-routing.module';
import { CategoriesComponent } from './categories/container/categories.component';

@NgModule({
  imports: [CommonModule, TranslateModule, IonicModule, CategoryItemDetailsRoutingModule],
  entryComponents: [CategoriesComponent],
  declarations: [CategoriesComponent, ItemsContainerComponent, ItemsComponent],
  providers: [ItemsListEndpoint]
})
export class CategoriesModule {}
