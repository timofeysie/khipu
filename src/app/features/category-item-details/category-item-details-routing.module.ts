import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { extract } from '@app/core';
import { ItemsContainerComponent } from './items/container/items-container.component';
import { CategoriesContainerComponent } from './categories/container/categories-list/categories-container.component';
import { AddCategoryContainerComponent } from './categories/container/add-category/add-category-container.component';
import { ItemDetailsContainerComponent } from './item-details/container/item-details/item-details-container.component';

const routes: Routes = [
  // Module is lazy loaded, see app-routing.module.ts
  { path: '', component: CategoriesContainerComponent, data: { title: extract('Categories') } },
  { path: ':name/:wdt/:wd/:language/items', component: ItemsContainerComponent, data: { title: extract('items') } },
  { path: 'add', component: AddCategoryContainerComponent, data: { title: extract('items') } },
  {
    path: 'item-details/:selectedCategory/:qcode/:label',
    component: ItemDetailsContainerComponent,
    data: { title: extract('items') }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class CategoryItemDetailsRoutingModule {}
