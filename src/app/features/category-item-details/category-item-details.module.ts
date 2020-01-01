import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { ItemsContainerComponent } from './items/container/items-container.component';
import { ItemsComponent } from './items/components/items.component';
import { ItemsListEndpoint } from './items/items.endpoint';
import { CategoryItemDetailsRoutingModule } from './category-item-details-routing.module';
import { CategoriesContainerComponent } from './categories/container/categories-container.component';
import { CategoryComponent } from './categories/components/category.component';

@NgModule({
  imports: [CommonModule, TranslateModule, IonicModule, CategoryItemDetailsRoutingModule],
  entryComponents: [CategoriesContainerComponent],
  declarations: [CategoriesContainerComponent, CategoryComponent, ItemsContainerComponent, ItemsComponent],
  providers: [ItemsListEndpoint]
})
export class CategoryItemDetailsModule {}
