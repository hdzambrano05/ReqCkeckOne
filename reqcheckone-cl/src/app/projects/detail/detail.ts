import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectsService, Project } from '../../services/projects';
import { RequirementsService } from '../../services/requirements';
import { TasksService } from '../../services/tasks';
import { AuthService } from '../../services/auth';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { BarController } from 'chart.js';
import { forkJoin, of } from 'rxjs';

declare var bootstrap: any;

Chart.register(BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export interface Requirement {
  id: number;
  project_id: number;
  title: string;
  text: string;
  context?: string;
  status: 'draft' | 'reviewed' | 'accepted' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  version: number;
  created_at: string;
  updated_at: string;
  analysis?: any;
}

@Component({
  selector: 'app-detail',
  standalone: false,
  templateUrl: './detail.html',
  styleUrls: ['./detail.css'],
})
export class Detail implements OnInit {
  project: Project | null = null;
  requirements: Requirement[] = [];

  loadingProject = true;
  loadingRequirements = true;
  loadingTasks = false;

  selectedRequirement: Requirement | null = null;
  selectedRequirementId: number | null = null;

  tasks: any[] = [];
  visibleTasks: any[] = [];
  unreadNotifications: any[] = [];

  unreadTasks = 0;
  userId = 0;

  private taskModal: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectsService: ProjectsService,
    private requirementsService: RequirementsService,
    private tasksService: TasksService,
    private authService: AuthService
  ) {
    this.userId = this.authService.getUserId()!;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadProject(id);
      this.loadRequirements(id);
      this.loadTasks(id);
    }
  }

  loadProject(id: number): void {
    this.projectsService.getProjectById(id).subscribe({
      next: (project) => {
        this.project = project;
        this.loadingProject = false;
      },
      error: (err) => {
        console.error('Error cargando proyecto:', err);
        this.loadingProject = false;
      },
    });
  }

  loadRequirements(projectId: number): void {
    this.requirementsService.getByProject(projectId).subscribe({
      next: (reqs: Requirement[]) => {
        this.requirements = (reqs || []).sort((a, b) => {
          const numA = this.getRequirementNumber(a.title);
          const numB = this.getRequirementNumber(b.title);

          if (numA !== numB) {
            return numA - numB;
          }

          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        this.loadingRequirements = false;
      },
      error: (err) => {
        console.error('Error cargando requisitos:', err);
        this.loadingRequirements = false;
      },
    });
  }

  private getRequirementNumber(title: string): number {
    if (!title) return Number.MAX_SAFE_INTEGER;

    const match = title.match(/RF\s*-\s*(\d+)/i);

    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  }

  loadTasks(projectId: number, showAlert = false): void {
    this.loadingTasks = true;

    this.tasksService.getByProject(projectId).subscribe({
      next: (tasks) => {
        if (!this.project) {
          this.loadingTasks = false;
          return;
        }

        const isOwner = this.project.owner_id === this.userId;

        if (isOwner) {
          this.tasks = tasks.filter((t: any) =>
            ['pending', 'accepted', 'rejected'].includes(t.status)
          );
        } else {
          this.tasks = tasks.filter(
            (t: any) =>
              t.assignee_id === this.userId &&
              ['pending', 'accepted'].includes(t.status)
          );
        }

        this.visibleTasks = [...this.tasks];

        this.unreadNotifications = this.tasks.filter(
          (t: any) =>
            !t.read_by_user &&
            (isOwner || t.assignee_id === this.userId)
        );

        this.unreadTasks = this.unreadNotifications.length;

        if (!isOwner) {
          this.checkUpcomingTasks(showAlert);
        }

        if (showAlert && this.unreadTasks > 0) {
          Swal.fire({
            icon: 'info',
            title: 'Tienes nueva actividad',
            text: `Hay ${this.unreadTasks} novedad(es) en tus tareas.`,
            timer: 1800,
            showConfirmButton: false,
          });
        }

        this.loadingTasks = false;
      },
      error: (err) => {
        console.error('Error cargando tareas', err);
        this.loadingTasks = false;
      },
    });
  }

  checkUpcomingTasks(showAlert: boolean): void {
    const now = new Date();

    this.tasks.forEach((t: any) => {
      if (!t.due_date) return;

      const due = new Date(t.due_date);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 2 && diffDays >= 0 && !t.notified && showAlert) {
        Swal.fire({
          icon: 'warning',
          title: 'Tarea próxima a vencer',
          text: `La tarea "${t.title}" vence en ${diffDays} día(s).`,
          timer: 2200,
          showConfirmButton: false,
        });
        t.notified = true;
      }
    });
  }

  openTasksModal(): void {
    const modalEl = document.getElementById('tasksModal');
    if (!modalEl) return;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    if (this.unreadNotifications.length === 0) {
      this.unreadTasks = 0;
      return;
    }

    const requests = this.unreadNotifications.map((task: any) =>
      this.tasksService.markAsRead(task.id)
    );

    forkJoin(requests.length ? requests : [of(null)]).subscribe({
      next: () => {
        this.tasks = this.tasks.map((task: any) => ({
          ...task,
          read_by_user: true,
        }));

        this.visibleTasks = [...this.tasks];
        this.unreadNotifications = [];
        this.unreadTasks = 0;
      },
      error: (err) => {
        console.error('Error marcando notificaciones como leídas', err);
      },
    });
  }

  openCreateTaskModal(): void {
    const modalEl = document.getElementById('createTaskModal');
    if (modalEl) {
      this.taskModal = new bootstrap.Modal(modalEl);
      this.taskModal.show();
    }
  }

  onTaskCreated(): void {
    if (this.project?.id) {
      this.loadTasks(this.project.id, true);
    }

    if (this.taskModal) {
      this.taskModal.hide();
    }
  }

  respondTask(taskId: number, accept: boolean): void {
    this.tasksService.respondTask(taskId, accept).subscribe({
      next: () => {
        const index = this.tasks.findIndex((t) => t.id === taskId);
        if (index !== -1) {
          this.tasks[index].status = accept ? 'accepted' : 'rejected';
          this.tasks[index].read_by_user = true;
        }

        this.visibleTasks = [...this.tasks];
        this.unreadNotifications = this.tasks.filter((t: any) => !t.read_by_user);
        this.unreadTasks = this.unreadNotifications.length;

        Swal.fire({
          icon: 'success',
          title: `Tarea ${accept ? 'aceptada' : 'rechazada'}`,
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo responder la tarea, intenta de nuevo.',
        });
      },
    });
  }

  getPendingCount(): number {
    return this.visibleTasks.filter((t: any) => t.status === 'pending').length;
  }

  getAcceptedCount(): number {
    return this.visibleTasks.filter((t: any) => t.status === 'accepted').length;
  }

  getRejectedCount(): number {
    return this.visibleTasks.filter((t: any) => t.status === 'rejected').length;
  }

  getTaskStatusClass(status: string): string {
    switch (status) {
      case 'accepted':
        return 'status-accepted';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  }

  goToAddRequirement(): void {
    if (!this.project) return;
    this.router.navigate([`/projects/${this.project.id}/requirements/create`]);
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  viewRequirement(id: number): void {
    if (!this.project) return;
    this.router.navigate([`/projects/${this.project.id}/requirements/${id}`]);
  }

  editRequirement(id: number): void {
    if (!this.project) return;
    this.router.navigate([`/projects/${this.project.id}/requirements/${id}/update`]);
  }

  deleteRequirement(id: number): void {
    const modalElement = document.getElementById('confirmDeleteModal') as any;
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
      this.selectedRequirementId = id;
    }
  }

  confirmDelete(): void {
    if (!this.selectedRequirementId) return;

    this.requirementsService.deleteRequirement(this.selectedRequirementId).subscribe({
      next: () => {
        if (this.project?.id) this.loadRequirements(this.project.id);
        this.selectedRequirementId = null;
      },
      error: (err) => {
        console.error('Error eliminando requisito:', err);
        Swal.fire('Error', 'No se pudo eliminar el requisito.', 'error');
      },
    });
  }

  async generatePDF(): Promise<void> {
    if (!this.project) return;

    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let yPos = 20;

    const navy: [number, number, number] = [15, 23, 42];
    const blue: [number, number, number] = [37, 99, 235];
    const indigo: [number, number, number] = [79, 70, 229];
    const purple: [number, number, number] = [124, 58, 237];
    const teal: [number, number, number] = [13, 148, 136];
    const green: [number, number, number] = [22, 163, 74];
    const amber: [number, number, number] = [217, 119, 6];
    const red: [number, number, number] = [220, 38, 38];
    const gray700: [number, number, number] = [55, 65, 81];
    const gray500: [number, number, number] = [107, 114, 128];
    const gray300: [number, number, number] = [209, 213, 219];
    const gray200: [number, number, number] = [229, 231, 235];
    const gray100: [number, number, number] = [243, 244, 246];
    const white: [number, number, number] = [255, 255, 255];

    const formatDate = (date?: string | Date | null) => {
      if (!date) return 'No disponible';
      try {
        return new Date(date).toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch {
        return 'No disponible';
      }
    };

    const sanitizeText = (value: any, fallback = 'No disponible') => {
      if (value === null || value === undefined || value === '') return fallback;
      return String(value);
    };

    const getStatusColor = (status: string): [number, number, number] => {
      const s = (status || '').toLowerCase();
      if (s.includes('accepted') || s.includes('acept')) return green;
      if (s.includes('review')) return blue;
      if (s.includes('draft')) return amber;
      if (s.includes('reject')) return red;
      return gray500;
    };

    const getPriorityColor = (priority: string): [number, number, number] => {
      const p = (priority || '').toLowerCase();
      if (p === 'high' || p === 'alta') return red;
      if (p === 'medium' || p === 'media') return amber;
      if (p === 'low' || p === 'baja') return green;
      return gray500;
    };

    const getQualityColor = (value: number): [number, number, number] => {
      if (value >= 80) return green;
      if (value >= 50) return amber;
      return red;
    };

    const addPageBackground = () => {
      doc.setFillColor(252, 252, 253);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    };

    const addFooter = () => {
      const totalPages = doc.getNumberOfPages();

      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        doc.setDrawColor(...gray200);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...gray500);
        doc.text('ReqCheckOne - Informe de requisitos', margin, pageHeight - 7);

        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 7, {
          align: 'right',
        });
      }
    };

    const checkPageBreak = (neededSpace: number) => {
      if (yPos + neededSpace > pageHeight - 22) {
        doc.addPage();
        addPageBackground();
        yPos = 20;
      }
    };

    const drawSectionTitle = (title: string, subtitle?: string) => {
      checkPageBreak(22);

      doc.setFillColor(...blue);
      doc.roundedRect(margin, yPos, 2.8, 13, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...navy);
      doc.text(title, margin + 8, yPos + 5.5);

      if (subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(...gray500);
        doc.text(subtitle, margin + 8, yPos + 10.5);
      }

      yPos += 18;
    };

    const drawInfoCard = (
      x: number,
      y: number,
      w: number,
      h: number,
      label: string,
      value: string,
      accent: [number, number, number]
    ) => {
      doc.setFillColor(...white);
      doc.setDrawColor(...gray200);
      doc.roundedRect(x, y, w, h, 4, 4, 'FD');

      doc.setFillColor(...accent);
      doc.roundedRect(x, y, 4, h, 4, 4, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...gray500);
      doc.text(label, x + 8, y + 7);

      const split = doc.splitTextToSize(value, w - 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...navy);
      doc.text(split, x + 8, y + 13);
    };

    const getRequirementOrderNumber = (title: string, fallbackIndex: number): number => {
      if (!title) return fallbackIndex + 1;
      const match = title.match(/RF\s*-\s*(\d+)/i);
      return match ? Number(match[1]) : fallbackIndex + 1;
    };

    const cleanRequirementTitle = (title: string, fallbackIndex: number): string => {
      const originalTitle = sanitizeText(title, `Requisito ${fallbackIndex + 1}`);
      return originalTitle.replace(/^RF\s*-\s*\d+\s*[-:\s]*/i, '').trim();
    };

    let logoBase64 = '';

    try {
      // Cambia esta ruta por el nombre real de tu archivo
      // Ejemplo: /imagenes/logo/logo.png
      logoBase64 = await this.loadImageAsBase64('/images/logo3.png');
    } catch (error) {
      console.error('No se pudo cargar el logo:', error);
    }

    addPageBackground();

    doc.setFillColor(...navy);
    doc.rect(0, 0, pageWidth, 78, 'F');

    doc.setFillColor(...blue);
    doc.circle(pageWidth - 22, 18, 22, 'F');

    doc.setFillColor(...indigo);
    doc.circle(pageWidth - 2, 42, 26, 'F');

    doc.setFillColor(...purple);
    doc.circle(20, 10, 12, 'F');

    const logoX = margin;
    const logoY = 18;
    const logoW = 34;
    const logoH = 22;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(255, 255, 255);
    doc.roundedRect(logoX, logoY, logoW, logoH, 4, 4, 'FD');

    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', logoX + 2, logoY + 2, logoW - 4, logoH - 4);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...navy);
      doc.text('LOGO', logoX + logoW / 2, logoY + 13, { align: 'center' });
    }

    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('INFORME DE', margin, 55);
    doc.text('REQUISITOS', margin, 66);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Documento ejecutivo del proyecto', margin, 74);

    doc.setFillColor(...white);
    doc.roundedRect(margin, 92, contentWidth, 48, 6, 6, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gray500);
    doc.text('Proyecto', margin + 10, 104);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...navy);
    const projectNameSplit = doc.splitTextToSize(
      sanitizeText(this.project.name, 'Proyecto sin nombre'),
      contentWidth - 20
    );
    doc.text(projectNameSplit, margin + 10, 114);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...gray700);
    doc.text(`Generado el ${formatDate(new Date())}`, margin + 10, 132);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...gray500);
    doc.text('Plataforma de análisis y gestión de requisitos', margin + 10, 138);

    const coverStatY = 154;
    const cardGap = 6;
    const cardW = (contentWidth - cardGap * 2) / 3;

    drawInfoCard(margin, coverStatY, cardW, 22, 'Requisitos', `${this.requirements.length}`, blue);
    drawInfoCard(
      margin + cardW + cardGap,
      coverStatY,
      cardW,
      22,
      'Estado',
      sanitizeText(this.project.status, 'Sin estado'),
      teal
    );
    drawInfoCard(
      margin + (cardW + cardGap) * 2,
      coverStatY,
      cardW,
      22,
      'Fecha límite',
      sanitizeText(formatDate(this.project.deadline), 'No definida'),
      purple
    );

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...gray500);
    doc.text(
      'Este informe resume la información general del proyecto y el estado de sus requisitos.',
      margin,
      188
    );

    doc.addPage();
    addPageBackground();
    yPos = 20;

    drawSectionTitle('Resumen general del proyecto', 'Información principal y contexto general');

    const summaryCardW = (contentWidth - 8) / 2;
    const summaryCardH = 24;

    drawInfoCard(
      margin,
      yPos,
      summaryCardW,
      summaryCardH,
      'Estado actual',
      sanitizeText(this.project.status, 'No definido'),
      blue
    );

    drawInfoCard(
      margin + summaryCardW + 8,
      yPos,
      summaryCardW,
      summaryCardH,
      'Fecha límite',
      formatDate(this.project.deadline),
      purple
    );

    yPos += 30;

    drawInfoCard(
      margin,
      yPos,
      summaryCardW,
      summaryCardH,
      'Creador',
      sanitizeText(this.project.owner?.username, 'No disponible'),
      teal
    );

    drawInfoCard(
      margin + summaryCardW + 8,
      yPos,
      summaryCardW,
      summaryCardH,
      'Colaboradores',
      `${this.project.collaborators?.length ? this.project.collaborators.length : 0} asignado(s)`,
      indigo
    );

    yPos += 34;

    const projectDescription = sanitizeText(
      this.project.description,
      'No se registró una descripción para este proyecto.'
    );

    const descText = doc.splitTextToSize(projectDescription, contentWidth - 16);
    const descTitleSpace = 8;
    const descTopPadding = 15;
    const descBottomPadding = 8;
    const descLineHeight = 5;
    const descBoxHeight =
      descTopPadding + descTitleSpace + descText.length * descLineHeight + descBottomPadding;

    checkPageBreak(descBoxHeight + 12);

    doc.setFillColor(...white);
    doc.setDrawColor(...gray200);
    doc.roundedRect(margin, yPos, contentWidth, descBoxHeight, 5, 5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...navy);
    doc.text('Descripción del proyecto', margin + 8, yPos + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...gray700);
    doc.text(descText, margin + 8, yPos + 15);

    yPos += descBoxHeight + 10;

    const collaborators = this.project.collaborators?.length
      ? this.project.collaborators.map((c: any) => `${c.username}${c.role ? ` - ${c.role}` : ''}`)
      : ['Sin colaboradores asignados'];

    const teamTitleHeight = 10;
    const collaboratorRowHeight = 9;
    const teamBlockHeight = teamTitleHeight + collaborators.length * collaboratorRowHeight + 4;

    checkPageBreak(teamBlockHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...navy);
    doc.text('Equipo del proyecto', margin, yPos);

    yPos += 8;

    collaborators.forEach((collab: string) => {
      checkPageBreak(10);

      doc.setFillColor(...gray100);
      doc.roundedRect(margin, yPos - 4, contentWidth, 7, 2, 2, 'F');

      doc.setFillColor(...blue);
      doc.circle(margin + 4, yPos - 0.8, 1.5, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...gray700);
      doc.text(collab, margin + 8, yPos);

      yPos += 9;
    });

    doc.addPage();
    addPageBackground();
    yPos = 20;

    drawSectionTitle(
      'Requisitos del proyecto',
      'Detalle funcional, prioridad, estado y nivel de calidad'
    );

    if (!this.requirements.length) {
      doc.setFillColor(...white);
      doc.setDrawColor(...gray200);
      doc.roundedRect(margin, yPos, contentWidth, 28, 5, 5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...navy);
      doc.text('No hay requisitos registrados', margin + 8, yPos + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...gray500);
      doc.text('Cuando se agreguen requisitos, aparecerán en esta sección.', margin + 8, yPos + 18);
    } else {
      this.requirements.forEach((req, index) => {
        let totalPercent = 0;

        try {
          const analysis =
            typeof req.analysis === 'string'
              ? JSON.parse(req.analysis)
              : req.analysis;

          totalPercent = Number(analysis?.promedio_cumplimiento ?? 0);
        } catch {
          totalPercent = 0;
        }

        const rfNumber = getRequirementOrderNumber(req.title, index);
        const cleanTitle = cleanRequirementTitle(req.title, index);

        const titleLines = doc.splitTextToSize(
          `RF-${rfNumber} ${cleanTitle}`,
          contentWidth - 28
        );

        const descLines = doc.splitTextToSize(
          sanitizeText(req.text, 'Sin descripción'),
          contentWidth - 16
        );

        const cardHeight =
          18 +
          titleLines.length * 6 +
          6 +
          descLines.length * 5 +
          18 +
          16;

        checkPageBreak(cardHeight + 10);

        doc.setFillColor(...white);
        doc.setDrawColor(...gray200);
        doc.roundedRect(margin, yPos, contentWidth, cardHeight, 6, 6, 'FD');

        doc.setFillColor(...navy);
        doc.roundedRect(margin, yPos, contentWidth, 14, 6, 6, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(...white);
        doc.text(`RF-${rfNumber}`, margin + 8, yPos + 9);

        let innerY = yPos + 24;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...navy);
        doc.text(titleLines, margin + 8, innerY);

        innerY += titleLines.length * 6 + 2;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...gray700);
        doc.text(descLines, margin + 8, innerY);

        innerY += descLines.length * 5 + 4;

        const statusColor = getStatusColor(req.status);
        const priorityColor = getPriorityColor(req.priority);

        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.roundedRect(margin + 8, innerY - 3.5, 34, 8, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...white);
        doc.text(
          sanitizeText(req.status, 'sin estado').toUpperCase(),
          margin + 25,
          innerY + 1.8,
          { align: 'center' }
        );

        doc.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2]);
        doc.roundedRect(margin + 46, innerY - 3.5, 34, 8, 3, 3, 'F');
        doc.text(
          sanitizeText(req.priority, 'sin prioridad').toUpperCase(),
          margin + 63,
          innerY + 1.8,
          { align: 'center' }
        );

        innerY += 12;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(...gray700);
        doc.text('Nivel de calidad del requisito', margin + 8, innerY);

        innerY += 5;

        const barX = margin + 8;
        const barY = innerY;
        const barW = contentWidth - 30;
        const barH = 7;
        const qualityColor = getQualityColor(totalPercent);

        doc.setFillColor(...gray200);
        doc.roundedRect(barX, barY, barW, barH, 3, 3, 'F');

        doc.setFillColor(qualityColor[0], qualityColor[1], qualityColor[2]);
        doc.roundedRect(barX, barY, (totalPercent / 100) * barW, barH, 3, 3, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...navy);
        doc.text(`${totalPercent}%`, margin + contentWidth - 10, barY + 5, {
          align: 'right',
        });

        yPos += cardHeight + 10;
      });
    }

    addFooter();
    doc.save(`${this.project.name}_Informe_Requisitos.pdf`);
  }

  private loadImageAsBase64(imagePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas.'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => {
        reject(new Error(`No se pudo cargar la imagen: ${imagePath}`));
      };

      img.src = imagePath;
    });
  }
}