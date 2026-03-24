import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RequirementsService } from '../../services/requirements';
import { ProjectsService } from '../../services/projects';
import { AuthService } from '../../services/auth';

interface Attribute {
  name: string;
  value: number;
  description: string;
  icon: string;
}

interface AgentAttribute {
  key: string;
  label: string;
  value: number;
}

interface AgentCard {
  role: string;
  porcentaje: number;
  atributos: AgentAttribute[];
  casos_prueba: string[];
  expanded?: boolean;
}

type ModalType = 'success' | 'error' | 'info' | 'loading';

@Component({
  selector: 'app-update-requirement',
  standalone: false,
  templateUrl: './update-requirement.html',
  styleUrls: ['./update-requirement.css']
})
export class UpdateRequirement implements OnInit {
  form!: FormGroup;

  loading = false;
  loadingAnalysis = false;
  canAnalyze = false;
  canSave = false;

  projectName = '';
  projectId!: number;
  requirementId!: number;
  description = '';

  analysis: any = null;
  agents: AgentCard[] = [];

  modalState = {
    show: false,
    message: '',
    type: 'info' as ModalType,
    callback: null as (() => void) | null
  };

  attributes: Attribute[] = [
    {
      name: 'Validez',
      value: 0,
      description: 'Evalúa si el requisito es correcto y pertinente para el dominio del proyecto.',
      icon: 'bi-patch-check'
    },
    {
      name: 'Claridad / No ambigüedad',
      value: 0,
      description: 'Determina si el requisito está redactado de manera clara y sin interpretaciones múltiples.',
      icon: 'bi-eye'
    },
    {
      name: 'Completitud',
      value: 0,
      description: 'Verifica si el requisito incluye toda la información necesaria para entenderlo e implementarlo.',
      icon: 'bi-grid-3x3-gap'
    },
    {
      name: 'Consistencia',
      value: 0,
      description: 'Mide si el requisito no entra en conflicto con otros requisitos o reglas del sistema.',
      icon: 'bi-shield-check'
    },
    {
      name: 'Viabilidad',
      value: 0,
      description: 'Analiza si el requisito puede realizarse técnica, operativa y económicamente.',
      icon: 'bi-gear-wide-connected'
    },
    {
      name: 'Priorización',
      value: 0,
      description: 'Valora si el requisito posee un nivel de prioridad adecuado según su impacto.',
      icon: 'bi-bar-chart-line'
    },
    {
      name: 'Trazabilidad',
      value: 0,
      description: 'Indica si puede rastrearse su origen, dependencia y relación con objetivos del proyecto.',
      icon: 'bi-diagram-3'
    },
    {
      name: 'Verificabilidad',
      value: 0,
      description: 'Determina si el requisito puede comprobarse mediante pruebas o criterios medibles.',
      icon: 'bi-clipboard2-check'
    },
    {
      name: 'Modificabilidad',
      value: 0,
      description: 'Mide qué tan fácil es cambiar el requisito sin generar alto impacto en otros elementos.',
      icon: 'bi-pencil-square'
    },
    {
      name: 'Necesidad / Relevancia',
      value: 0,
      description: 'Evalúa si el requisito realmente aporta valor y responde a una necesidad del sistema.',
      icon: 'bi-stars'
    },
    {
      name: 'Singularidad / Atomicidad',
      value: 0,
      description: 'Verifica que el requisito represente una sola idea clara y no varias mezcladas.',
      icon: 'bi-bounding-box'
    },
    {
      name: 'Conformidad',
      value: 0,
      description: 'Valora si cumple normas, estándares o lineamientos aplicables al proyecto.',
      icon: 'bi-journal-check'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private requirementsService: RequirementsService,
    private projectsService: ProjectsService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.requirementId = Number(this.route.snapshot.paramMap.get('id'));
    this.initForm();
    this.loadRequirement();
  }

  initForm(): void {
    this.form = this.fb.group({
      title: ['', Validators.required],
      text: ['', Validators.required],
      descripcion_proyecto: [''],
      status: ['draft', Validators.required],
      priority: [{ value: 'medium', disabled: true }],
      due_date: [''],
      version: [1, [Validators.required, Validators.min(1)]]
    });
  }

  loadRequirement(): void {
    this.loading = true;

    this.requirementsService.getById(this.requirementId).subscribe({
      next: (req: any) => {
        this.loading = false;

        this.form.patchValue({
          title: req.title ?? '',
          text: req.text ?? '',
          descripcion_proyecto: req.descripcion_proyecto ?? '',
          status: req.status ?? 'draft',
          priority: req.priority ?? 'medium',
          due_date: req.due_date ?? '',
          version: req.version ?? 1
        });

        if (req.project_id) {
          this.projectsService.getProjectById(req.project_id).subscribe({
            next: (project: any) => {
              this.projectName = project.name ?? '';
              this.projectId = project.id;
              this.description = project.description ?? '';

              this.form.patchValue({
                descripcion_proyecto:
                  this.form.get('descripcion_proyecto')?.value || this.description
              });
            },
            error: () => this.openModal('Error cargando proyecto.', 'error')
          });
        }

        if (req.analysis) {
          try {
            this.analysis =
              typeof req.analysis === 'string' ? JSON.parse(req.analysis) : req.analysis;

            this.processAnalysis();
            this.calculateAttributes();
            this.updateSavePermission();

            const poAnalysis = this.analysis?.agents?.['Product Owner']?.analysis;
            const prioridad = poAnalysis?.priorizacion || req.priority || 'medium';
            this.form.get('priority')?.setValue(prioridad);
          } catch (e) {
            console.error('Error parseando analysis:', e);
          }
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error(err);
        this.openModal('Error cargando requisito.', 'error');
      }
    });
  }

  enableAnalyze(): void {
    this.canAnalyze = true;
  }

  analyzeRequirement(): void {
    const text = this.form.get('text')?.value;
    const descripcion_proyecto = this.form.get('descripcion_proyecto')?.value;

    if (!text) {
      this.openModal('No hay descripción del requisito para analizar.', 'error');
      return;
    }

    this.loadingAnalysis = true;
    this.analysis = null;
    this.agents = [];
    this.canSave = false;

    const payload = {
      id: 'REQ-TEMP',
      text,
      descripcion_proyecto
    };

    this.openModal('Por favor, espere mientras se analiza el requisito...', 'loading');

    this.requirementsService.analyzeRequirement(payload).subscribe({
      next: (res: any) => {
        this.analysis = res?.data ?? null;

        this.processAnalysis();
        this.calculateAttributes();

        const poAnalysis = this.analysis?.agents?.['Product Owner']?.analysis;
        const prioridad = poAnalysis?.priorizacion || 'medium';
        this.form.get('priority')?.setValue(prioridad);

        this.updateSavePermission();

        const promedio = this.analysis?.promedio_cumplimiento ?? 0;

        if (promedio < 30) {
          this.canSave = false;
          this.openModal(
            'El promedio de cumplimiento es menor a 30%. No se puede guardar el requisito.',
            'error'
          );
        } else if (promedio < 60) {
          this.openModal(
            'El requisito es aceptable, pero aún tiene sugerencias de mejora.',
            'info'
          );
        } else {
          this.closeModal();
        }

        this.loadingAnalysis = false;
        this.canAnalyze = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loadingAnalysis = false;
        this.openModal('Error analizando requisito. Revisa la consola.', 'error');
      }
    });
  }

  processAnalysis(): void {
    this.agents = [];

    if (!this.analysis?.agents) return;

    Object.entries(this.analysis.agents).forEach(([role, data]: any, index: number) => {
      const atributos: AgentAttribute[] = [];

      Object.entries(data.analysis || {}).forEach(([key, value]: any) => {
        if (key !== 'casos_prueba') {
          atributos.push({
            key,
            label: this.mapKey(key),
            value: value === true ? (data.porcentaje || 0) : (data.porcentaje || 0)
          });
        }
      });

      this.agents.push({
        role,
        porcentaje: data.porcentaje || 0,
        atributos,
        casos_prueba: data.analysis?.casos_prueba || [],
        expanded: index === 0
      });
    });
  }

  calculateAttributes(): void {
    this.attributes.forEach(attr => {
      let total = 0;
      let count = 0;

      this.agents.forEach(agent => {
        agent.atributos.forEach((a: AgentAttribute) => {
          if (a.label === attr.name) {
            total += a.value;
            count++;
          }
        });
      });

      attr.value = count ? Math.round(total / count) : 0;
    });
  }

  mapKey(key: string): string {
    const mapping: { [key: string]: string } = {
      validez: 'Validez',
      claridad: 'Claridad / No ambigüedad',
      completitud: 'Completitud',
      consistencia: 'Consistencia',
      viabilidad: 'Viabilidad',
      priorizacion: 'Priorización',
      trazabilidad: 'Trazabilidad',
      verificabilidad: 'Verificabilidad',
      modificabilidad: 'Modificabilidad',
      necesidad: 'Necesidad / Relevancia',
      atomicidad: 'Singularidad / Atomicidad',
      conformidad: 'Conformidad'
    };

    return mapping[key.toLowerCase()] || key;
  }

  updateSavePermission(): void {
    const promedio = this.analysis?.promedio_cumplimiento ?? 0;
    this.canSave = promedio >= 60;
  }

  get averageScore(): number {
    return Math.round(this.analysis?.promedio_cumplimiento ?? 0);
  }

  get scoreLabel(): string {
    const value = this.averageScore;

    if (value >= 80) return 'Excelente';
    if (value >= 60) return 'Aceptable';
    if (value >= 30) return 'Bajo revisión';
    return 'Crítico';
  }

  get scoreClass(): string {
    const value = this.averageScore;

    if (value >= 80) return 'score-excellent';
    if (value >= 60) return 'score-good';
    if (value >= 30) return 'score-warning';
    return 'score-danger';
  }

  get priorityLabel(): string {
    const value = (this.form.get('priority')?.value || '').toString().toLowerCase();

    const mapping: any = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      critical: 'Crítica'
    };

    return mapping[value] || value || 'Media';
  }

  getPriorityBadgeClass(): string {
    const value = (this.form.get('priority')?.value || '').toString().toLowerCase();

    if (value === 'critical') return 'priority-critical';
    if (value === 'high') return 'priority-high';
    if (value === 'medium') return 'priority-medium';
    return 'priority-low';
  }

  getAttributeStateClass(value: number): string {
    if (value >= 80) return 'metric-high';
    if (value >= 50) return 'metric-medium';
    return 'metric-low';
  }

  getAttributeIcon(value: number): string {
    if (value >= 80) return 'bi-emoji-smile';
    if (value >= 50) return 'bi-emoji-neutral';
    return 'bi-emoji-frown';
  }

  toggleAgent(agent: AgentCard): void {
    agent.expanded = !agent.expanded;
  }

  updateRequirement(): void {
    if (this.form.invalid || !this.canSave) {
      this.openModal(
        'No se puede guardar. Verifica que el análisis tenga un cumplimiento suficiente.',
        'error'
      );
      return;
    }

    const currentUserId = this.authService.getUserId();
    const payload: any = {
      ...this.form.getRawValue()
    };

    if (currentUserId) {
      payload.changed_by = currentUserId;
    }

    if (this.analysis) {
      payload.analysis = this.analysis;
    }

    this.loading = true;
    this.openModal('Actualizando requisito, por favor espere...', 'loading');

    this.requirementsService.updateRequirement(this.requirementId, payload).subscribe({
      next: () => {
        this.loading = false;
        this.openModal(
          'Requisito actualizado correctamente.',
          'success',
          () => this.router.navigate([`/projects/${this.projectId}`])
        );
      },
      error: (err: any) => {
        this.loading = false;
        console.error(err);
        this.openModal('Error al actualizar el requisito.', 'error');
      }
    });
  }

  goBack(): void {
    if (this.projectId) {
      this.router.navigate([`/projects/${this.projectId}`]);
    } else {
      this.router.navigate(['/requirements']);
    }
  }

  openModal(
    message: string,
    type: ModalType = 'info',
    callback: (() => void) | null = null
  ): void {
    this.modalState = {
      show: true,
      message,
      type,
      callback
    };
  }

  closeModal(): void {
    const callback = this.modalState.callback;
    this.modalState = {
      ...this.modalState,
      show: false,
      callback: null
    };

    if (callback) {
      callback();
    }
  }
}