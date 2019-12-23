import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { extract } from '@app/core';
import { CategoriesComponent } from './categories.component';
import { ItemsContainerComponent } from './items/container/items-container.component';

const routes: Routes = [
  // Module is lazy loaded, see app-routing.module.ts
  { path: '', component: CategoriesComponent, data: { title: extract('Categories') } },
<<<<<<< HEAD
  { path: 'items', component: ItemsContainerComponent, data: { title: extract('items') } }
=======
  { path: ':name/:wdt/:wd/items', component: ItemsContainerComponent, data: { title: extract('items') } }
>>>>>>> e043ee3bf7588420ccf7530fffac1d07a77291f9
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class CategoriesRoutingModule {}
