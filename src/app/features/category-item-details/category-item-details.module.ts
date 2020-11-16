import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { ItemsContainerComponent } from './items/container/items-container.component';
import { ItemsComponent } from './items/components/items.component';
import { ItemsListEndpoint } from './items/items.endpoint';

import { ItemDetailsContainerComponent } from './item-details/container/item-details/item-details-container.component';
import { ItemDetailsComponent } from './item-details/components/item-details/item-details.component';

import { CategoryItemDetailsRoutingModule } from './category-item-details-routing.module';
import { CategoriesContainerComponent } from './categories/container/categories-list/categories-container.component';
import { CategoryComponent } from './categories/components/categories-list/category.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoriesEndpoint } from './categories/categories.endpoint';

import { AddCategoryContainerComponent } from './categories/container/add-category/add-category-container.component';
import { AddCategoryComponent } from './categories/components/add-category/add-category.component';

@NgModule({
  imports: [CommonModule, TranslateModule, IonicModule, CategoryItemDetailsRoutingModule, ReactiveFormsModule],
  entryComponents: [CategoriesContainerComponent],
  declarations: [
    CategoriesContainerComponent,
    CategoryComponent,
    ItemsContainerComponent,
    ItemsComponent,
    ItemDetailsContainerComponent,
    ItemDetailsComponent,
    AddCategoryContainerComponent,
    AddCategoryComponent
  ],
  providers: [ItemsListEndpoint, CategoriesEndpoint]
})
export class CategoryItemDetailsModule {}
