import { Component, OnInit, OnDestroy } from '@angular/core';
import Chart from 'chart.js/auto';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProjectsService } from '../../services/projects';
import { RequirementsService } from '../../services/requirements';

interface Project {
  id: number;
  name: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface Requirement {
  id: number;
  project_id: number;
  title?: string;
  text?: string;
  status?: string;
  priority?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProjectWithRequirements extends Project {
  requirements: Requirement[];
  requirementsCount: number;
}

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit, OnDestroy {
  requirementsChart: Chart | null = null;
  statusChart: Chart | null = null;
  priorityChart: Chart | null = null;
  trendChart: Chart | null = null;

  userName = 'Usuario';
  today = new Date();

  projects: ProjectWithRequirements[] = [];

  totalProjects = 0;
  activeProjects = 0;
  completedProjects = 0;
  pausedProjects = 0;

  totalRequirements = 0;
  avgRequirementsPerProject = 0;
  highPriorityRequirements = 0;
  pendingRequirements = 0;

  topProjects: ProjectWithRequirements[] = [];
  recentProjects: ProjectWithRequirements[] = [];

  loading = true;
  error = '';

  constructor(
    private projectService: ProjectsService,
    private reqService: RequirementsService
  ) { }

  ngOnInit(): void {
    this.loadUserName();
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  loadUserName(): void {
    const possibleName =
      localStorage.getItem('userName') ||
      localStorage.getItem('username') ||
      localStorage.getItem('name') ||
      sessionStorage.getItem('userName') ||
      sessionStorage.getItem('username') ||
      sessionStorage.getItem('name');

    if (possibleName && possibleName.trim()) {
      this.userName = possibleName;
    }
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = '';

    this.projectService.getUserProjects().subscribe({
      next: (projects: Project[]) => {
        if (!projects || projects.length === 0) {
          this.projects = [];
          this.resetStats();
          this.destroyCharts();
          this.loading = false;
          return;
        }

        const requests = projects.map((project) =>
          this.reqService.getByProject(project.id).pipe(
            catchError(() => of([]))
          )
        );

        forkJoin(requests).subscribe({
          next: (responses: Requirement[][]) => {
            this.projects = projects.map((project, index) => ({
              ...project,
              requirements: responses[index] || [],
              requirementsCount: (responses[index] || []).length
            }));

            this.buildStats();
            this.buildCollections();

            setTimeout(() => {
              this.renderCharts();
            }, 50);

            this.loading = false;
          },
          error: () => {
            this.error = 'No se pudieron cargar los requisitos de los proyectos.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'No se pudieron cargar los proyectos.';
        this.loading = false;
      }
    });
  }

  resetStats(): void {
    this.totalProjects = 0;
    this.activeProjects = 0;
    this.completedProjects = 0;
    this.pausedProjects = 0;
    this.totalRequirements = 0;
    this.avgRequirementsPerProject = 0;
    this.highPriorityRequirements = 0;
    this.pendingRequirements = 0;
    this.topProjects = [];
    this.recentProjects = [];
  }

  buildStats(): void {
    this.totalProjects = this.projects.length;

    this.activeProjects = this.projects.filter(p =>
      this.normalizeText(p.status) === 'active'
    ).length;

    this.completedProjects = this.projects.filter(p =>
      this.normalizeText(p.status) === 'completed'
    ).length;

    this.pausedProjects = this.projects.filter(p => {
      const status = this.normalizeText(p.status);
      return status === 'paused' || status === 'on hold' || status === 'inactive';
    }).length;

    const allRequirements = this.projects.flatMap(p => p.requirements);

    this.totalRequirements = allRequirements.length;
    this.avgRequirementsPerProject =
      this.totalProjects > 0 ? Number((this.totalRequirements / this.totalProjects).toFixed(1)) : 0;

    this.highPriorityRequirements = allRequirements.filter(r => {
      const priority = this.normalizeText(r.priority);
      return priority === 'high' || priority === 'alta';
    }).length;

    this.pendingRequirements = allRequirements.filter(r => {
      const status = this.normalizeText(r.status);
      return status === 'pending' || status === 'pendiente' || status === 'todo';
    }).length;
  }

  buildCollections(): void {
    this.topProjects = [...this.projects]
      .sort((a, b) => b.requirementsCount - a.requirementsCount)
      .slice(0, 5);

    this.recentProjects = [...this.projects]
      .sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
        const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 6);
  }

  renderCharts(): void {
    this.destroyCharts();

    this.createRequirementsPerProjectChart();
    this.createProjectStatusChart();
    this.createPriorityChart();
    this.createTrendChart();
  }

  destroyCharts(): void {
    this.requirementsChart?.destroy();
    this.statusChart?.destroy();
    this.priorityChart?.destroy();
    this.trendChart?.destroy();
  }

  createRequirementsPerProjectChart(): void {
    const sorted = [...this.projects]
      .sort((a, b) => b.requirementsCount - a.requirementsCount)
      .slice(0, 7);

    const labels = sorted.map(p => p.name);
    const data = sorted.map(p => p.requirementsCount);

    this.requirementsChart = new Chart('requirementsPerProjectChart', {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Requisitos por proyecto',
          data,
          borderRadius: 12,
          barThickness: 18,
          backgroundColor: [
            'rgba(99, 102, 241, 0.85)',
            'rgba(56, 189, 248, 0.85)',
            'rgba(16, 185, 129, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(236, 72, 153, 0.85)',
            'rgba(168, 85, 247, 0.85)',
            'rgba(239, 68, 68, 0.85)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.08)' },
            ticks: { color: '#000000' }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#000000' }
          }
        }
      }
    });
  }

  createProjectStatusChart(): void {
    const statusMap = this.groupProjectsByStatus();

    this.statusChart = new Chart('projectStatusChart', {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusMap),
        datasets: [{
          data: Object.values(statusMap),
          backgroundColor: [
            'rgba(16, 185, 129, 0.9)',
            'rgba(99, 102, 241, 0.9)',
            'rgba(245, 158, 11, 0.9)',
            'rgba(239, 68, 68, 0.9)',
            'rgba(148, 163, 184, 0.9)'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#000000',
              padding: 18
            }
          }
        }
      }
    });
  }

  createPriorityChart(): void {
    const priorityMap = this.groupRequirementsByPriority();

    this.priorityChart = new Chart('priorityChart', {
      type: 'polarArea',
      data: {
        labels: Object.keys(priorityMap),
        datasets: [{
          data: Object.values(priorityMap),
          backgroundColor: [
            'rgba(239, 68, 68, 0.75)',
            'rgba(245, 158, 11, 0.75)',
            'rgba(34, 197, 94, 0.75)',
            'rgba(148, 163, 184, 0.75)'
          ],
          borderWidth: 1,
          borderColor: 'rgb(0, 0, 0)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#000000',
              padding: 16
            }
          }
        },
        scales: {
          r: {
            grid: { color: 'rgba(255,255,255,0.08)' },
            ticks: { color: '#000000', backdropColor: 'transparent' },
            pointLabels: { color: '#000000' }
          }
        }
      }
    });
  }

  createTrendChart(): void {
    const monthlyMap = this.groupRequirementsByMonth();

    this.trendChart = new Chart('trendChart', {
      type: 'line',
      data: {
        labels: Object.keys(monthlyMap),
        datasets: [{
          label: 'Requisitos creados',
          data: Object.values(monthlyMap),
          tension: 0.35,
          fill: true,
          backgroundColor: 'rgba(99, 102, 241, 0.16)',
          borderColor: 'rgba(99, 102, 241, 1)',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#000000' }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { color: '#000000' }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { color: '#000000' }
          }
        }
      }
    });
  }

  groupProjectsByStatus(): Record<string, number> {
    const map: Record<string, number> = {};

    this.projects.forEach(project => {
      const raw = this.normalizeText(project.status);
      let label = 'Sin estado';

      if (raw === 'active') label = 'Activos';
      else if (raw === 'completed') label = 'Completados';
      else if (raw === 'paused' || raw === 'on hold' || raw === 'inactive') label = 'Pausados';
      else if (raw) label = this.capitalize(raw);

      map[label] = (map[label] || 0) + 1;
    });

    return map;
  }

  groupRequirementsByPriority(): Record<string, number> {
    const map: Record<string, number> = {
      'Alta': 0,
      'Media': 0,
      'Baja': 0,
      'Sin prioridad': 0
    };

    this.projects.flatMap(p => p.requirements).forEach(req => {
      const priority = this.normalizeText(req.priority);

      if (priority === 'high' || priority === 'alta') map['Alta']++;
      else if (priority === 'medium' || priority === 'media') map['Media']++;
      else if (priority === 'low' || priority === 'baja') map['Baja']++;
      else map['Sin prioridad']++;
    });

    return map;
  }

  groupRequirementsByMonth(): Record<string, number> {
    const months: Record<string, number> = {};

    this.projects.flatMap(p => p.requirements).forEach(req => {
      const dateValue = req.created_at || req.updated_at;
      if (!dateValue) return;

      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return;

      const key = date.toLocaleDateString('es-CO', {
        month: 'short',
        year: 'numeric'
      });

      months[key] = (months[key] || 0) + 1;
    });

    const sortedEntries = Object.entries(months).sort((a, b) => {
      return new Date(a[0]).getTime() - new Date(b[0]).getTime();
    });

    if (sortedEntries.length === 0) {
      return { 'Sin datos': 0 };
    }

    return Object.fromEntries(sortedEntries.slice(-6));
  }

  getProjectProgress(project: ProjectWithRequirements): number {
    if (!project.requirements?.length) return 0;

    const done = project.requirements.filter(r => {
      const status = this.normalizeText(r.status);
      return status === 'done' || status === 'completed' || status === 'aprobado';
    }).length;

    return Math.round((done / project.requirements.length) * 100);
  }

  getGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  formatDate(date?: string): string {
    if (!date) return 'Sin fecha';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return 'Sin fecha';

    return parsed.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  normalizeText(value?: string): string {
    return (value || '').trim().toLowerCase();
  }

  capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}