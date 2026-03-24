import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { Home } from './dashboard/home/home';
import { List } from './projects/list/list';
import { Create } from './projects/create/create';
import { Detail } from './projects/detail/detail';
import { CreateRequirement } from './requirements/create-requirement/create-requirement';
import { DetailRequirement } from './requirements/detail-requirement/detail-requirement';
import { HistoryRequirements } from './requirements/history-requirements/history-requirements';
import { UpdateRequirement } from './requirements/update-requirement/update-requirement';
import { Landing } from './pages/landing/landing';
import { AuthGuard } from './core/auth-guard';


const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'home', component: Home, canActivate: [AuthGuard] },
  { path: 'projects', component: List, canActivate: [AuthGuard] },
  { path: 'projects/create', component: Create, canActivate: [AuthGuard] },
  { path: 'projects/:id', component: Detail, canActivate: [AuthGuard] },
  { path: 'projects/:id/requirements/create', component: CreateRequirement, canActivate: [AuthGuard] },
  { path: 'projects/:projectId/requirements/:id', component: DetailRequirement, canActivate: [AuthGuard] },
  { path: 'projects/:projectId/requirements/:id/update', component: UpdateRequirement, canActivate: [AuthGuard] },
  { path: 'requirements/history', component: HistoryRequirements, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: '**', redirectTo: 'landing' },
  { path: '', component: Landing }, // ← Página principal
  { path: '**', redirectTo: '' } // ← Redirección si la ruta no existe
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})


export class AppRoutingModule { }

