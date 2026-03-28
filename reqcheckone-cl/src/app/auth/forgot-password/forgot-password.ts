import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPassword {
  forgotForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotForm = this.fb.group({
      identifier: ['', [Validators.required]]
    });
  }

  get identifier() {
    return this.forgotForm.get('identifier');
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.authService.forgotPassword(this.forgotForm.value).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.successMessage = response.message || 'Usuario encontrado';

        if (response.resetToken) {
          localStorage.setItem('resetToken', response.resetToken);
        }

        if (response.user) {
          localStorage.setItem('resetUser', JSON.stringify(response.user));
        }

        this.router.navigate(['/reset-password']);
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message || 'Ocurrió un error al intentar recuperar la contraseña';
      }
    });
  }
}