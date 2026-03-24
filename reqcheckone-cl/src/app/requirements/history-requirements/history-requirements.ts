import { Component } from '@angular/core';
import { RequirementHistory } from '../../services/requirement-history';
import { RequirementsService } from '../../services/requirements';
import { forkJoin } from 'rxjs';

interface ProjectHistory {
  projectName: string;
  requirements: any[];
  expanded: boolean;
}

@Component({
  selector: 'app-history-requirements',
  standalone: false,
  templateUrl: './history-requirements.html',
  styleUrls: ['./history-requirements.css']
})
export class HistoryRequirements {
  historyList: any[] = [];
  groupedHistory: ProjectHistory[] = [];
  loading = true;

  constructor(
    private historyService: RequirementHistory,
    private requirementsService: RequirementsService
  ) { }

  ngOnInit(): void {
    this.loadUserHistory();
  }

  loadUserHistory(): void {
    this.loading = true;

    this.historyService.getByUser().subscribe({
      next: (data) => {

        // Si no hay historial
        if (!data || data.length === 0) {
          this.historyList = [];
          this.groupedHistory = [];
          this.loading = false;
          return;
        }

        // Ordenar por fecha descendente
        this.historyList = data.sort((a, b) =>
          b.updated_at.localeCompare(a.updated_at)
        );

        const requests$ = this.historyList.map(item =>
          this.requirementsService.getById(item.requirement?.id)
        );

        forkJoin(requests$).subscribe({
          next: (requirementsData) => {
            this.historyList.forEach((item, index) => {
              item.currentStatus = requirementsData[index]?.status || 'activo';
            });

            this.groupHistoryByProject();
            this.loading = false;
          },
          error: (err) => {
            console.error('Error al obtener requisitos actuales:', err);
            this.groupHistoryByProject();
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
        this.loading = false;
      }
    });
  }

  private groupHistoryByProject(): void {
    const grouped: { [key: string]: any[] } = {};

    this.historyList.forEach(item => {
      const projectName = item.requirement?.project?.name || 'Proyecto Desconocido';
      if (!grouped[projectName]) {
        grouped[projectName] = [];
      }
      grouped[projectName].push(item);
    });

    this.groupedHistory = Object.keys(grouped).map(projectName => ({
      projectName,
      requirements: grouped[projectName],
      expanded: false // Flag para colapsar/expandir
    }));
  }

  // Toggle para expandir/colapsar proyecto
  toggleProject(project: ProjectHistory): void {
    project.expanded = !project.expanded;
  }
}
