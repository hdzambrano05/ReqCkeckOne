import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  isSidebarOpen = true;
  title = signal('reqcheckone-cl');

  constructor(public authService: AuthService) { }

  ngOnInit() {
    
  }

  get isLoggedIn() {
    return this.authService.isLoggedIn();
  }
}
