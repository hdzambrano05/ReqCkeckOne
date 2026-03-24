import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

/* Components */
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { Home } from './dashboard/home/home';
import { Sidebar } from './shared/sidebar/sidebar';
import { List } from './projects/list/list';
import { Create } from './projects/create/create';
import { Detail } from './projects/detail/detail';
import { CreateRequirement } from './requirements/create-requirement/create-requirement';
import { DetailRequirement } from './requirements/detail-requirement/detail-requirement';
import { HistoryRequirements } from './requirements/history-requirements/history-requirements';
import { UpdateRequirement } from './requirements/update-requirement/update-requirement';
import { TaskCreate } from './tasks/task-create/task-create';
import { Landing } from './pages/landing/landing';

/* Core */
import { AuthInterceptor } from './core/auth-interceptor';
import { AuthGuard } from './core/auth-guard';


@NgModule({
  declarations: [
    App,
    Login,
    Register,
    Home,
    Sidebar,
    List,
    Create,
    Detail,
    CreateRequirement,
    DetailRequirement,
    HistoryRequirements,
    UpdateRequirement,
    TaskCreate,
    Landing

  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    AppRoutingModule,// ✅ Standalone components van en imports
  ],
  exports: [Sidebar],
  providers: [
    AuthGuard,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [App]
})
export class AppModule { }
