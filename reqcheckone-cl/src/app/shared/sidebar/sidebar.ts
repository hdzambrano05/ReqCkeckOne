import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class Sidebar {
  @Input() isSidebarOpen: boolean = true; // viene del padre
  @Output() isSidebarOpenChange = new EventEmitter<boolean>();

  constructor(public authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/landing']);
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.isSidebarOpenChange.emit(this.isSidebarOpen); // avisamos al padre
  }

  get username(): string {
    return localStorage.getItem('username') || 'Usuario';
  }
}
