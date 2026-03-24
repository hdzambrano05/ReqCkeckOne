import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RequirementsService {
  private apiUrl = 'http://localhost:3000/requirements';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // Token JWT guardado
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  // Listar requisitos por proyecto
    getByProject(projectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/project/${projectId}`, {
      headers: this.getHeaders()
    });
  }

  // Crear requisito
  addRequirement(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, data, { headers: this.getHeaders() });
  }

  // Obtener requisito por id
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Analizar requisito con los agentes
  analyzeRequirement(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/analyze`, data, { headers: this.getHeaders() });
  }

  // Eliminar requisito
  deleteRequirement(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  updateRequirement(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }




}
