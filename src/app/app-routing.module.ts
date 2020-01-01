import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { Shell } from '@app/shell/shell.service';

const routes: Routes = [
  Shell.childRoutes([
    { path: 'about', loadChildren: './features/about/about.module#AboutModule' },
    { path: 'options', loadChildren: './features/options/options.module#OptionsModule' },
    { path: 'theme', loadChildren: './features/theme/theme.module#ThemeModule' },
    {
      path: 'categories',
      loadChildren: './features/category-item-details/category-item-details.module#CategoryItemDetailsModule'
    }
  ]),
  // Fallback when no prior route is matched
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule {}
