import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { RequirementsService } from '../../services/requirements';
import { AuthService } from '../../services/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectsService, Project } from '../../services/projects';
import { Tooltip } from 'bootstrap';

interface Attribute {
  name: string;
  value: number;
}

interface RefinedRequirement {
  estado?: 'aceptado' | 'opcional' | 'rechazado' | 'sugerencias' | 'refinado_obligatorio';
  sugerencias?: string[];
  requisito_refinado?: string;
}

interface RequirementAnalysis {
  promedio_cumplimiento?: number;
  agents: { [agent: string]: { analysis: any; porcentaje?: number } };
  opciones_requisito?: RefinedRequirement;
}

@Component({
  selector: 'app-create-requirement',
  templateUrl: './create-requirement.html',
  styleUrls: ['./create-requirement.css'],
  standalone: false
})
export class CreateRequirement implements OnInit, AfterViewInit {
  form: FormGroup;
  analysis: RequirementAnalysis | null = null;
  loadingAnalysis = false;
  canSave = false;

  username = '';
  projectId!: number;
  projectName = '';
  description = '';

  nextRfNumber: number = 1;
  nextRfCode: string = 'RF-1';

  modalMessage = '';
  showModal = false;
  modalType: 'success' | 'error' | 'info' = 'info';

  showSavedSuccessModal = false;

  attributes: Attribute[] = [
    { name: 'Validez', value: 0 },
    { name: 'Claridad / No ambigüedad', value: 0 },
    { name: 'Completitud', value: 0 },
    { name: 'Consistencia', value: 0 },
    { name: 'Viabilidad', value: 0 },
    { name: 'Priorización', value: 0 },
    { name: 'Trazabilidad', value: 0 },
    { name: 'Verificabilidad', value: 0 },
    { name: 'Modificabilidad', value: 0 },
    { name: 'Necesidad / Relevancia', value: 0 },
    { name: 'Singularidad / Atomicidad', value: 0 },
    { name: 'Conformidad', value: 0 }
  ];

  private attrMap: Record<string, string> = {
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

  attributeSuggestions: { [uiName: string]: string[] } = {};

  attributeDescriptions: { [key: string]: string } = {
    'Validez': 'El requisito representa una necesidad real del usuario o sistema.',
    'Claridad / No ambigüedad': 'El requisito se entiende de una sola forma.',
    'Completitud': 'Incluye entradas, procesos y salidas.',
    'Consistencia': 'No contradice otros requisitos.',
    'Viabilidad': 'Puede implementarse con los recursos disponibles.',
    'Priorización': 'Tiene un nivel de importancia definido.',
    'Trazabilidad': 'Puede rastrearse desde su origen hasta su prueba.',
    'Verificabilidad': 'Puede comprobarse con pruebas o revisión.',
    'Modificabilidad': 'Puede cambiarse sin afectar otros requisitos.',
    'Necesidad / Relevancia': 'Es realmente necesario y justificado.',
    'Singularidad / Atomicidad': 'Expresa una sola necesidad.',
    'Conformidad': 'Cumple con normas o plantillas establecidas.'
  };

  constructor(
    private fb: FormBuilder,
    private requirementsService: RequirementsService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private projectsService: ProjectsService,
    private cd: ChangeDetectorRef
  ) {
    this.username = localStorage.getItem('username') || '';

    this.form = this.fb.group({
      project_id: [''],
      title: ['', Validators.required],
      text: ['', Validators.required],
      descripcion_proyecto: [''],
      status: ['draft'],
      priority: [{ value: 'medium', disabled: true }],
      due_date: [''],
      version: [1],
      created_by: [{ value: this.username, disabled: true }]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');

      if (!idParam) return;

      this.projectId = +idParam;
      this.form.get('project_id')?.setValue(this.projectId);

      this.loadProject();
      this.loadNextRfFromProject();
    });
  }

  ngAfterViewInit(): void {
    const tooltipTriggerList = Array.from(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );

    tooltipTriggerList.forEach(el => new Tooltip(el));
  }

  get priorityControl(): FormControl {
    return this.form.get('priority') as FormControl;
  }

  get createdByControl(): FormControl {
    return this.form.get('created_by') as FormControl;
  }

  openModal(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.modalMessage = message;
    this.modalType = type;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalMessage = '';
  }

  private loadProject(): void {
    this.projectsService.getProjectById(this.projectId).subscribe({
      next: (project: Project) => {
        this.projectName = project.name || '';
        this.description = project.description || '';

        this.form.patchValue({
          descripcion_proyecto: this.description
        });
      },
      error: err => {
        console.error('Error cargando proyecto:', err);
      }
    });
  }

  /**
   * Carga los requisitos ya existentes del proyecto y calcula el siguiente RF.
   * Si tu servicio usa otro nombre para este método, cambia solo esta llamada.
   */
  private loadNextRfFromProject(): void {
    this.requirementsService.getByProject(this.projectId).subscribe({
      next: (requirements: any[]) => {
        this.calculateNextRfCode(requirements || []);
      },
      error: err => {
        console.error('Error cargando requisitos del proyecto:', err);
        this.nextRfNumber = 1;
        this.nextRfCode = 'RF-1';
      }
    });
  }

  /**
   * Detecta títulos como:
   * RF-1
   * RF-2
   * RF-15 Login
   * RF-20 - Registro de usuarios
   */
  private calculateNextRfCode(requirements: any[]): void {
    if (!requirements || requirements.length === 0) {
      this.nextRfNumber = 1;
      this.nextRfCode = 'RF-1';
      return;
    }

    let maxNumber = 0;

    for (const req of requirements) {
      const title = (req?.title || '').toString().trim().toUpperCase();

      const match = title.match(/^RF-(\d+)/);
      if (match) {
        const currentNumber = parseInt(match[1], 10);
        if (!isNaN(currentNumber) && currentNumber > maxNumber) {
          maxNumber = currentNumber;
        }
      }
    }

    this.nextRfNumber = maxNumber + 1;
    this.nextRfCode = `RF-${this.nextRfNumber}`;
  }

  analyzeRequirement(): void {
    const text = this.form.value.text;
    const descripcion_proyecto = this.form.value.descripcion_proyecto;

    if (!text) {
      this.openModal('Debes escribir la descripción del requisito antes de analizar.', 'info');
      return;
    }

    this.loadingAnalysis = true;
    this.analysis = null;
    this.canSave = false;
    this.attributeSuggestions = {};
    this.attributes.forEach(a => (a.value = 0));

    const payload = {
      id: 'REQ-TEMP',
      text,
      descripcion_proyecto
    };

    this.requirementsService.analyzeRequirement(payload).subscribe({
      next: (res) => {
        const data = res.data;
        console.log('Respuesta backend (raw):', data);

        this.analysis = {
          promedio_cumplimiento: data.promedio_cumplimiento,
          agents: {},
          opciones_requisito: {
            requisito_refinado: data.opciones_requisito?.requisito_refinado || ''
          }
        };

        if (data.sugerencias_combinadas) {
          this.updateAttributesFromSuggestions(data.sugerencias_combinadas);
        }

        if (data.analisis_detallado) {
          for (const [agentName, agentData] of Object.entries<any>(data.analisis_detallado)) {
            const atributos = (agentData as any).atributos || {};
            const analysisPlain: Record<string, any> = {};

            for (const [backendKey, detalle] of Object.entries<any>(atributos)) {
              analysisPlain[backendKey] =
                detalle?.valor !== undefined ? detalle.valor : detalle;

              if (detalle?.sugerencia) {
                const uiName = this.attrMap[backendKey] ?? backendKey;

                if (!this.attributeSuggestions[uiName]) {
                  this.attributeSuggestions[uiName] = [];
                }

                const suggestionText = `${agentName}: ${detalle.sugerencia}`;

                if (!this.attributeSuggestions[uiName].includes(suggestionText)) {
                  this.attributeSuggestions[uiName].push(suggestionText);
                }
              }
            }

            this.analysis.agents[agentName] = {
              analysis: analysisPlain,
              porcentaje: (agentData as any).porcentaje
            };
          }
        }

        this.cd.detectChanges();

        const poAnalysis = this.analysis.agents?.['Product Owner']?.analysis;
        const prioridad = poAnalysis?.priorizacion === 'alta'
          ? 'high'
          : poAnalysis?.priorizacion === 'media'
            ? 'medium'
            : 'low';

        this.priorityControl.setValue(prioridad);

        const promedio = this.analysis.promedio_cumplimiento ?? 0;
        this.canSave = promedio >= 60;

        if (promedio < 30) {
          this.canSave = false;
          this.openModal(
            'El requisito no cumple el mínimo de calidad (menor a 30%), no se puede guardar.',
            'error'
          );
        }

        this.loadingAnalysis = false;
      },
      error: (err) => {
        console.error('Error analizando requisito:', err);
        this.loadingAnalysis = false;
        this.openModal('Error analizando requisito. Revisa la consola.', 'error');
      }
    });
  }

  private updateAttributesFromSuggestions(suggestions: string[]): void {
    this.attributes.forEach(a => (a.value = 0));
    this.attributeSuggestions = {};

    const tempSuggestions: { [uiName: string]: Set<string> } = {};

    suggestions.forEach(s => {
      const match = s.match(/- \((.+) - (\w+) - ([0-9.]+)%\): Sugerencia: (.+)/);

      if (match) {
        const agentName = match[1];
        const backendKey = match[2].toLowerCase();
        const porcentaje = parseFloat(match[3]);
        const suggestionText = match[4];

        const uiName = this.attrMap[backendKey];
        if (!uiName) return;

        const attr = this.attributes.find(a => a.name === uiName);
        if (attr) {
          attr.value = Math.max(attr.value, porcentaje);
        }

        if (!tempSuggestions[uiName]) {
          tempSuggestions[uiName] = new Set<string>();
        }

        tempSuggestions[uiName].add(`${agentName}: ${suggestionText}`);
      }
    });

    for (const uiName of Object.keys(tempSuggestions)) {
      this.attributeSuggestions[uiName] = Array.from(tempSuggestions[uiName]);
    }
  }

  saveRequirement(): void {
    if (!this.analysis) {
      this.openModal('Primero debes analizar el requisito antes de guardarlo.', 'info');
      return;
    }

    const userId = localStorage.getItem('id');

    if (!userId) {
      this.openModal('No se pudo identificar al usuario. Inicia sesión nuevamente.', 'error');
      return;
    }

    if (!this.projectId) {
      this.openModal('No se ha cargado un proyecto válido.', 'error');
      return;
    }

    const raw = this.form.getRawValue();
    const cleanTitle = (raw.title || '').trim();

    const payload = {
      project_id: this.projectId,
      title: `${this.nextRfCode} ${cleanTitle}`,
      text: raw.text,
      descripcion_proyecto: raw.descripcion_proyecto || null,
      status: raw.status,
      priority: this.priorityControl.value || 'medium',
      due_date: raw.due_date || null,
      version: raw.version || 1,
      created_by: +userId,
      analysis: {
        promedio_cumplimiento: this.analysis?.promedio_cumplimiento ?? 0,
        opciones_requisito: this.analysis?.opciones_requisito ?? null,
        agents: this.analysis?.agents ?? {}
      }
    };

    this.requirementsService.addRequirement(payload).subscribe({
      next: () => {
        this.showSavedSuccessModal = true;

        this.form.reset({
          project_id: this.projectId,
          title: '',
          text: '',
          descripcion_proyecto: this.description,
          status: 'draft',
          priority: 'medium',
          due_date: '',
          version: 1,
          created_by: this.username
        });

        this.analysis = null;
        this.canSave = false;
        this.attributes.forEach(a => (a.value = 0));
        this.attributeSuggestions = {};

        // recalcular siguiente RF desde BD
        this.loadNextRfFromProject();
      },
      error: err => {
        console.error('Error guardando requisito:', err);
        this.openModal('Ocurrió un error al guardar el requisito.', 'error');
      }
    });
  }

  analyzeAnotherRequirement(): void {
    window.location.reload();
  }

  finishRequirementFlow(): void {
    this.showSavedSuccessModal = false;
    this.goBack();
  }

  getTotalProgress(): number {
    if (!this.attributes.length) return 0;
    const total = this.attributes.reduce((sum, a) => sum + a.value, 0);
    return Math.round(total / this.attributes.length);
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId]);
  }

  copyRefinedToText(): void {
    const refined = this.analysis?.opciones_requisito?.requisito_refinado;

    if (refined) {
      this.form.patchValue({ text: refined });
      this.openModal('El requisito refinado ha sido copiado al campo de descripción.', 'info');
    } else {
      this.openModal('No hay requisito refinado disponible.', 'error');
    }
  }
}