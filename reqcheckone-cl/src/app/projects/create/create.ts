import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectsService } from '../../services/projects';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

declare var bootstrap: any;

@Component({
  selector: 'app-create-project',
  standalone: false,
  templateUrl: './create.html',
  styleUrls: ['./create.css']
})
export class Create implements OnInit {
  projectForm: FormGroup;
  error: string | null = null;
  users: any[] = [];
  selectedCollaborators: any[] = [];
  searchTerm: string = '';

  constructor(
    private fb: FormBuilder,
    private projectsService: ProjectsService,
    private http: HttpClient,
    private router: Router
  ) {
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      deadline: [''],
      status: ['active'],
      collaborators: [[]]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.http.get<any[]>(`${environment.apiUrl}/users`, {
      headers: this.projectsService['getHeaders']()
    }).subscribe({
      next: (data) => {
        this.users = data || [];
      },
      error: (err) => {
        console.error('Error cargando usuarios', err);
      }
    });
  }

  openCollaboratorsModal(): void {
    const modalElement = document.getElementById('collaboratorsModal');
    if (!modalElement) return;

    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }

  filteredUsers(): any[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.users;
    }

    return this.users.filter((u) =>
      `${u.username || ''} ${u.email || ''}`.toLowerCase().includes(term)
    );
  }

  toggleCollaborator(user: any): void {
    if (this.isSelected(user)) {
      this.selectedCollaborators = this.selectedCollaborators.filter(
        (u) => u.id !== user.id
      );
    } else {
      this.selectedCollaborators.push(user);
    }

    this.syncCollaboratorsWithForm();
  }

  isSelected(user: any): boolean {
    return this.selectedCollaborators.some((u) => u.id === user.id);
  }

  removeCollaborator(user: any): void {
    this.selectedCollaborators = this.selectedCollaborators.filter(
      (u) => u.id !== user.id
    );
    this.syncCollaboratorsWithForm();
  }

  clearCollaborators(): void {
    this.selectedCollaborators = [];
    this.syncCollaboratorsWithForm();
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  syncCollaboratorsWithForm(): void {
    this.projectForm.patchValue({
      collaborators: this.selectedCollaborators.map((u) => u.id)
    });
  }

  createProject(): void {
    this.error = null;

    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.projectForm.value,
      owner_id: Number(localStorage.getItem('id')),
      collaborators: this.projectForm.value.collaborators
    };

    this.projectsService.createProject(payload).subscribe({
      next: () => this.goBack(),
      error: () => {
        this.error = 'No se pudo crear el proyecto. Intenta nuevamente.';
      }
    });
  }

  autoResize(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  get statusLabel(): string {
    const status = this.projectForm.get('status')?.value;

    switch (status) {
      case 'active':
        return 'Activo';
      case 'completed':
        return 'Completado';
      case 'archived':
        return 'Archivado';
      default:
        return 'Sin estado';
    }
  }

  get statusClass(): string {
    const status = this.projectForm.get('status')?.value;

    switch (status) {
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'archived':
        return 'status-archived';
      default:
        return 'status-archived';
    }
  }
}