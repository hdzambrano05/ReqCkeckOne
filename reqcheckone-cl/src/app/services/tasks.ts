import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`
    });
  }

  /** 🔹 Obtener todas las tareas de un proyecto */
  getByProject(projectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/project/${projectId}`, {
      headers: this.getHeaders()
    });
  }

  /** 🔹 Crear nueva tarea */
  create(taskData: any): Observable<any> {
    return this.http.post(this.apiUrl, taskData, {
      headers: this.getHeaders()
    });
  }

  /** 🔹 Marcar una tarea como vista (notificación leída) */
  markAsRead(taskId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${taskId}/read`, {}, {
      headers: this.getHeaders()
    });
  }

  /** 🔹 Responder una tarea (aceptar o rechazar) */
  respondTask(taskId: number, accept: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${taskId}/respond`, { accept }, {
      headers: this.getHeaders()
    });
  }
}
