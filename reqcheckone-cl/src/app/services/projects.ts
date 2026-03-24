import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

// 👤 Interfaz del creador del proyecto
export interface Owner {
  id: number;
  username: string;
  email: string;
}

// 👥 Interfaz del colaborador
export interface Collaborator {
  id: number;
  username: string;
  role: string;
}

// 📌 Interfaz principal del Proyecto
export interface Project {
  id: number;
  name: string;
  description: string;
  status?: string;
  deadline?: string;
  owner_id?: number;
  owner?: Owner;                  // ✅ ahora existe
  collaborators?: Collaborator[]; // ✅ tipado claro
  requisitos?: any[];
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private base = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // ✅ Lista de proyectos del usuario autenticado
  getUserProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.base}/my`, { headers: this.getHeaders() });
  }

  // ✅ Detalle de un proyecto específico
  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.base}/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ✅ Crear proyecto con owner y colaboradores
  createProject(payload: {
    name: string;
    description?: string;
    status?: 'active' | 'completed' | 'archived';
    deadline?: string;
    collaborators?: number[]; // IDs de usuarios colaboradores
  }): Observable<any> {
    const userId = localStorage.getItem('id');
    const body = { ...payload, owner_id: userId };
    return this.http.post(`${this.base}/`, body, { headers: this.getHeaders() });
  }

  // ✅ Eliminar proyecto
  deleteProject(id: number): Observable<any> {
    return this.http.delete(`${this.base}/${id}`, { headers: this.getHeaders() });
  }
}
