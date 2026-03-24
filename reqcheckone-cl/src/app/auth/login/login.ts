import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, LoginCredentials } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {
  form!: FormGroup;
  error = '';
  loading = false;
  showPassword = false; // 👈 para ver/ocultar contraseña

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;

    const { username, password } = this.form.value;

    const credentials: LoginCredentials = username.includes('@')
      ? { email: username, password }
      : { username, password };

    this.auth.login(credentials).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Credenciales incorrectas';
      }
    });
  }
}
