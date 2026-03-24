
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RequirementHistory {
  private apiUrl = 'http://localhost:3000/requirement_history';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // 🔹 Obtener historial de los proyectos del usuario logueado
  getByUser(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user`, { headers: this.getHeaders() });
  }

  // 🔹 Obtener historial de un requisito específico
  getByRequirement(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/requirement/${id}`, { headers: this.getHeaders() });
  }
}

