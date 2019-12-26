import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { extract } from '@app/core';
import { CategoriesComponent } from './categories.component';
import { ItemsContainerComponent } from './items/container/items-container.component';

const routes: Routes = [
  // Module is lazy loaded, see app-routing.module.ts
  { path: '', component: CategoriesComponent, data: { title: extract('Categories') } },
  { path: ':name/:wdt/:wd/:language/items', component: ItemsContainerComponent, data: { title: extract('items') } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class CategoriesRoutingModule {}
