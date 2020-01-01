import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { extract } from '@app/core';
import { ItemsContainerComponent } from './items/container/items-container.component';
import { CategoriesContainerComponent } from './categories/container/categories-container.component';

const routes: Routes = [
  // Module is lazy loaded, see app-routing.module.ts
  { path: '', component: CategoriesContainerComponent, data: { title: extract('Categories') } },
  { path: ':name/:wdt/:wd/:language/items', component: ItemsContainerComponent, data: { title: extract('items') } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class CategoryItemDetailsRoutingModule {}
