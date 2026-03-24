import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RequirementsService } from '../../services/requirements';
import { ProjectsService } from '../../services/projects';

interface AgentAnalysis {
  role: string;
  analysis: Record<string, any>;
  porcentaje: number;
}

interface AnalysisData {
  promedio_cumplimiento: number;
  refined_requirement: {
    estado: string;
    mensaje: string;
    sugerencias?: string[];
  };
  agents: Record<string, AgentAnalysis>;
}

interface Requirement {
  id: number;
  project_id: number;
  title: string;
  text: string;
  context?: string;
  status: string;
  priority: string;
  version: number;
  analysis?: string | AnalysisData;
  created_at: string;
  updated_at: string;
}

interface FormattedAgent {
  role: string;
  porcentaje: number;
  expanded: boolean;
  attributes: {
    name: string;
    value: string;
    rawKey: string;
  }[];
  casos: string[];
}

interface AttributeSummary {
  name: string;
  value: number;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-detail-requirement',
  standalone: false,
  templateUrl: './detail-requirement.html',
  styleUrls: ['./detail-requirement.css'],
})
export class DetailRequirement implements OnInit {
  requirement: Requirement | null = null;
  analysis: AnalysisData | null = null;
  loading = true;
  projectName = '';
  projectDescription = '';

  formattedAgents: FormattedAgent[] = [];
  attributes: AttributeSummary[] = [];

  readonly attributeMeta: Record<string, { description: string; icon: string }> = {
    Validez: {
      description: 'Evalúa si el requisito corresponde a una necesidad real del dominio.',
      icon: 'bi-patch-check'
    },
    Claridad: {
      description: 'Mide si el requisito está redactado de forma precisa y entendible.',
      icon: 'bi-eye'
    },
    Completitud: {
      description: 'Verifica si el requisito contiene toda la información importante.',
      icon: 'bi-grid-3x3-gap'
    },
    Consistencia: {
      description: 'Determina si no presenta contradicciones con otros requisitos.',
      icon: 'bi-shield-check'
    },
    Viabilidad: {
      description: 'Mide si es posible implementarlo técnica y operativamente.',
      icon: 'bi-gear-wide-connected'
    },
    Priorización: {
      description: 'Indica la relevancia del requisito frente a otros del proyecto.',
      icon: 'bi-bar-chart-line'
    },
    Trazabilidad: {
      description: 'Permite rastrear el requisito a su origen y dependencias.',
      icon: 'bi-diagram-3'
    },
    Verificabilidad: {
      description: 'Evalúa si el requisito puede comprobarse mediante pruebas.',
      icon: 'bi-clipboard-check'
    },
    Modificabilidad: {
      description: 'Mide qué tan sencillo es ajustar el requisito sin generar impactos altos.',
      icon: 'bi-pencil-square'
    },
    Necesidad: {
      description: 'Determina si realmente aporta valor al producto o sistema.',
      icon: 'bi-stars'
    },
    Atomicidad: {
      description: 'Verifica si el requisito expresa una sola idea concreta.',
      icon: 'bi-bounding-box'
    },
    Conformidad: {
      description: 'Valida si cumple estándares, lineamientos o restricciones.',
      icon: 'bi-journal-check'
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requirementsService: RequirementsService,
    private projectsService: ProjectsService
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadRequirement(id);
    }
  }

  loadRequirement(id: number): void {
    this.loading = true;

    this.requirementsService.getById(id).subscribe({
      next: (req: Requirement) => {
        this.requirement = req;
        this.loading = false;

        if (req.project_id) {
          this.projectsService.getProjectById(req.project_id).subscribe({
            next: (project: any) => {
              this.projectName = project?.name || 'No disponible';
              this.projectDescription = project?.description || '';
            },
            error: (err) => {
              console.error('Error cargando nombre del proyecto:', err);
              this.projectName = 'No disponible';
              this.projectDescription = '';
            }
          });
        }

        if (req.analysis) {
          try {
            const parsed =
              typeof req.analysis === 'string'
                ? JSON.parse(req.analysis)
                : req.analysis;

            this.analysis = {
              promedio_cumplimiento: parsed?.promedio_cumplimiento || 0,
              refined_requirement: {
                estado: parsed?.refined_requirement?.estado || 'Generado',
                mensaje:
                  parsed?.refined_requirement?.mensaje ||
                  parsed?.opciones_requisito?.requisito_refinado ||
                  'No disponible',
                sugerencias:
                  parsed?.refined_requirement?.sugerencias || []
              },
              agents: parsed?.agents || parsed?.agentes || {},
            };

            this.buildAgents(this.analysis.agents);
            this.buildAttributes(this.analysis.agents);
          } catch (error) {
            console.error('Error parseando análisis:', error);
            this.analysis = null;
            this.formattedAgents = [];
            this.attributes = [];
          }
        }
      },
      error: (err) => {
        console.error('Error cargando requisito:', err);
        this.loading = false;
      },
    });
  }

  buildAgents(agents: Record<string, AgentAnalysis> | undefined): void {
    if (!agents) {
      this.formattedAgents = [];
      return;
    }

    this.formattedAgents = Object.entries(agents).map(([role, data]: [string, any], index: number) => {
      const attributes = Object.entries(data?.analysis || {})
        .filter(([key]) => key !== 'casos_prueba')
        .map(([key, value]) => ({
          name: this.formatKey(key),
          value: this.formatValue(value),
          rawKey: key
        }));

      return {
        role,
        porcentaje: data?.porcentaje || 0,
        expanded: index === 0,
        attributes,
        casos: data?.analysis?.casos_prueba || [],
      };
    });
  }

  buildAttributes(agents: Record<string, AgentAnalysis> | undefined): void {
    if (!agents) {
      this.attributes = [];
      return;
    }

    const map: Record<string, { total: number; count: number }> = {};

    Object.values(agents).forEach((agent: any) => {
      Object.keys(agent?.analysis || {}).forEach((key) => {
        if (key === 'casos_prueba') return;

        if (!map[key]) {
          map[key] = { total: 0, count: 0 };
        }

        map[key].total += agent?.porcentaje || 0;
        map[key].count++;
      });
    });

    const desiredOrder = [
      'Validez',
      'Claridad',
      'Completitud',
      'Consistencia',
      'Viabilidad',
      'Priorización',
      'Trazabilidad',
      'Verificabilidad',
      'Modificabilidad',
      'Necesidad',
      'Atomicidad',
      'Conformidad',
    ];

    this.attributes = Object.keys(map)
      .map((key) => {
        const name = this.formatKey(key);
        return {
          name,
          value: Math.round(map[key].total / map[key].count),
          description: this.attributeMeta[name]?.description || 'Sin descripción disponible.',
          icon: this.attributeMeta[name]?.icon || 'bi-sliders'
        };
      })
      .sort((a, b) => desiredOrder.indexOf(a.name) - desiredOrder.indexOf(b.name));
  }

  formatKey(key: string): string {
    const mapping: Record<string, string> = {
      validez: 'Validez',
      claridad: 'Claridad',
      completitud: 'Completitud',
      consistencia: 'Consistencia',
      viabilidad: 'Viabilidad',
      priorizacion: 'Priorización',
      trazabilidad: 'Trazabilidad',
      verificabilidad: 'Verificabilidad',
      modificabilidad: 'Modificabilidad',
      necesidad: 'Necesidad',
      atomicidad: 'Atomicidad',
      conformidad: 'Conformidad',
    };

    return mapping[key.toLowerCase()] || key;
  }

  formatValue(value: any): string {
    if (value === true) return 'Sí';
    if (value === false) return 'No';
    if (value === null || value === undefined || value === '') return 'No definido';
    return String(value);
  }

  formatDate(value?: string): string {
    if (!value) return 'No disponible';

    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  getStatusClass(status?: string): string {
    const normalized = (status || '').toLowerCase();

    if (normalized === 'aprobado' || normalized === 'accepted') return 'status-success';
    if (normalized === 'pendiente' || normalized === 'draft' || normalized === 'reviewed') return 'status-warning';
    if (normalized === 'rechazado' || normalized === 'rejected') return 'status-danger';

    return 'status-default';
  }

  getStatusLabel(status?: string): string {
    const normalized = (status || '').toLowerCase();

    const mapping: Record<string, string> = {
      accepted: 'Aceptado',
      aprobado: 'Aceptado',
      draft: 'Borrador',
      reviewed: 'Revisado',
      pendiente: 'Pendiente',
      rejected: 'Rechazado',
      rechazado: 'Rechazado'
    };

    return mapping[normalized] || status || 'No definido';
  }

  getPriorityLabel(priority?: string): string {
    const normalized = (priority || '').toLowerCase();

    const mapping: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      critical: 'Crítica'
    };

    return mapping[normalized] || priority || 'No definida';
  }

  getPriorityClass(priority?: string): string {
    const normalized = (priority || '').toLowerCase();

    if (normalized === 'critical') return 'priority-critical';
    if (normalized === 'high') return 'priority-high';
    if (normalized === 'medium') return 'priority-medium';
    return 'priority-low';
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  }

  getScoreLabel(score: number): string {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Aceptable';
    if (score >= 30) return 'En revisión';
    return 'Crítico';
  }

  getScoreIcon(score: number): string {
    if (score >= 80) return 'bi-emoji-smile';
    if (score >= 50) return 'bi-emoji-neutral';
    return 'bi-emoji-frown';
  }

  getAnalysisStateClass(): string {
    return this.getScoreClass(this.analysis?.promedio_cumplimiento || 0);
  }

  toggleAgent(agent: FormattedAgent): void {
    agent.expanded = !agent.expanded;
  }

  get totalAgents(): number {
    return this.formattedAgents.length;
  }

  get totalAttributes(): number {
    return this.attributes.length;
  }

  get totalTestCases(): number {
    return this.formattedAgents.reduce((acc, agent) => acc + (agent.casos?.length || 0), 0);
  }

  goBack(): void {
    if (this.requirement) {
      this.router.navigate([`/projects/${this.requirement.project_id}`]);
    } else {
      this.router.navigate(['/projects']);
    }
  }
}