import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectsService, Project } from '../../services/projects';
import { RequirementsService } from '../../services/requirements';
import { AuthService } from '../../services/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

interface Task {
  title: string;
  description: string;
  project_id: number;
  assignee_id: number;
  requirement_id?: number;
  due_date?: string;
}

@Component({
  selector: 'app-task-create',
  standalone: false,
  templateUrl: './task-create.html',
  styleUrls: ['./task-create.css'],
})
export class TaskCreate implements OnInit {
  @Input() projectId!: number;
  @Output() taskCreated = new EventEmitter<void>();

  form!: FormGroup;
  project?: Project;
  collaborators: any[] = [];
  requirements: any[] = [];
  isOwner = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private projectsService: ProjectsService,
    private requirementsService: RequirementsService,
    private authService: AuthService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(8)]],
      assignee_id: ['', Validators.required],
      requirement_id: [''],
      due_date: [''],
    });

    this.loadProjectData();
  }

  loadProjectData(): void {
    this.projectsService.getProjectById(this.projectId).subscribe({
      next: (project) => {
        this.project = project;
        const userId = this.authService.getUserId();
        this.isOwner = userId === project.owner_id;

        if (!this.isOwner) return;

        this.collaborators = project.collaborators || [];

        this.requirementsService.getByProject(this.projectId).subscribe({
          next: (reqs) => {
            this.requirements = reqs || [];
          },
          error: (err) => console.error('Error cargando requisitos', err),
        });
      },
      error: (err) => console.error('Error al obtener el proyecto', err),
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.isOwner) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: Task = {
      title: this.form.value.title?.trim(),
      description: this.form.value.description?.trim(),
      project_id: this.projectId,
      assignee_id: Number(this.form.value.assignee_id),
      requirement_id: this.form.value.requirement_id
        ? Number(this.form.value.requirement_id)
        : undefined,
      due_date: this.form.value.due_date || undefined,
    };

    this.loading = true;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });

    this.http.post(`${environment.apiUrl}/tasks`, payload, { headers }).subscribe({
      next: () => {
        this.loading = false;

        Swal.fire({
          icon: 'success',
          title: 'Tarea creada con éxito',
          text: 'La tarea fue registrada correctamente.',
          timer: 1800,
          showConfirmButton: false,
        });

        this.form.reset();
        this.taskCreated.emit();

        const modalElement = document.getElementById('createTaskModal');
        if (modalElement) {
          (window as any).bootstrap.Modal.getInstance(modalElement)?.hide();
        }
      },
      error: (err) => {
        this.loading = false;
        console.error(err);

        Swal.fire({
          icon: 'error',
          title: 'Error al crear la tarea',
          text: 'Inténtalo nuevamente.',
        });
      },
    });
  }

  get f() {
    return this.form.controls;
  }
}