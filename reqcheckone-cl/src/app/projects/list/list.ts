import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectsService, Project } from '../../services/projects';

declare var bootstrap: any;

@Component({
  selector: 'app-list',
  standalone: false,
  templateUrl: './list.html',
  styleUrls: ['./list.css']
})
export class List implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  loading = true;
  error: string | null = null;

  projectToDelete: Project | null = null;
  myId: string | null = null;

  // Filtros y vista
  searchTerm: string = '';
  statusFilter: string = '';
  viewMode: 'cards' | 'list' = 'cards';

  // Instancias de modales
  deleteModalInstance: any = null;
  notOwnerModalInstance: any = null;

  constructor(
    private projectsService: ProjectsService,
    private router: Router
  ) { }

  ngOnInit() {
    this.myId = localStorage.getItem('id');
    this.loadProjects();

    // Inicializar modales
    const deleteModalEl = document.getElementById('deleteModal');
    if (deleteModalEl) {
      this.deleteModalInstance = new bootstrap.Modal(deleteModalEl);
    }

    const notOwnerModalEl = document.getElementById('notOwnerModal');
    if (notOwnerModalEl) {
      this.notOwnerModalInstance = new bootstrap.Modal(notOwnerModalEl);
    }
  }

  // Cargar proyectos
  loadProjects() {
    this.projectsService.getUserProjects().subscribe({
      next: (data) => {
        this.projects = data;
        this.filteredProjects = [...this.projects];
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudieron cargar los proyectos.';
        this.loading = false;
      }
    });
  }

  // Navegación
  createProject() {
    this.router.navigate(['/projects/create']);
  }

  viewProject(id: number) {
    this.router.navigate([`/projects/${id}`]);
  }

  // Validar dueño
  isOwner(project: Project): boolean {
    return project.owner_id?.toString() === this.myId;
  }

  // Abrir modal de eliminar
  openDeleteModal(project: Project) {

    if (!this.isOwner(project)) {
      this.notOwnerModalInstance?.show();
      return;
    }

    this.projectToDelete = project;
    this.deleteModalInstance?.show();
  }

  // Confirmar eliminación
  confirmDelete() {
    if (!this.projectToDelete) {
      console.log('No hay proyecto seleccionado para eliminar');
      return;
    }
    this.projectsService.deleteProject(this.projectToDelete.id).subscribe({
      next: (resp) => {
        this.projects = this.projects.filter(
          (p) => p.id !== this.projectToDelete!.id
        );
        this.filterProjects();
        this.deleteModalInstance?.hide();
        this.projectToDelete = null;
      },
      error: (err) => {
        alert(err?.error?.message || 'No se pudo eliminar el proyecto.');
        this.projectToDelete = null;
      }
    });
  }
  // Cancelar eliminación
  cancelDelete() {
    this.deleteModalInstance?.hide();
    this.projectToDelete = null;
  }

  // Buscar y filtrar
  filterProjects() {
    this.filteredProjects = this.projects.filter(
      (p) =>
        p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) &&
        (this.statusFilter ? p.status === this.statusFilter : true)
    );
  }

  // Cambiar vista
  toggleView() {
    this.viewMode = this.viewMode === 'cards' ? 'list' : 'cards';
  }

  // Obtener ID del usuario logueado
  getLoggedUserId(): number | null {
    const id = localStorage.getItem('id');
    return id ? Number(id) : null;
  }

  // Truncar texto
  truncateText(text: string, limit: number = 120): string {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }
}