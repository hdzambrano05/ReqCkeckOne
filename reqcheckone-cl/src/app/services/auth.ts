import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  login(credentials: LoginCredentials): Observable<any> {
    return this.http.post(`${this.base}/users/login`, credentials).pipe(
      tap((res: any) => {
        if (res?.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('token_time', Date.now().toString()); // ⏳ guarda el tiempo
        }
        if (res?.user?.username) {
          localStorage.setItem('username', res.user.username);
          localStorage.setItem('id', res.user.id);
        }
      })
    );
  }

  register(payload: { username: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.base}/users`, payload);
  }

  logout() {
    localStorage.clear();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    const tokenTime = localStorage.getItem('token_time');

    if (!token || !tokenTime) return false;

    // ⏳ Expira después de 1h
    const elapsed = Date.now() - parseInt(tokenTime, 10);
    if (elapsed > 60 * 60 * 1000) {
      this.logout();
      return false;
    }
    return true;
  }

  getUserId(): number | null {
    const id = localStorage.getItem('id');
    return id ? Number(id) : null;
  }

  getUserById(id: number): Observable<{ id: number; username: string; email?: string; name?: string }> {
  return this.http.get<{ id: number; username: string; email?: string; name?: string }>(`${this.base}/users/${id}`);
}

}
