import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { AuthService } from '../services/auth';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService) { }

  canActivate(): boolean {
    if (this.auth.isLoggedIn()) {
      return true;
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Sesión expirada',
        text: 'Por favor, inicie sesión nuevamente.',
        confirmButtonText: 'Ir al login'
      }).then(() => {
        window.location.href = '/login';
      });
      return false;
    }
  }
}
