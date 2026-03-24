import { Component } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-landing',
  standalone: false,
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class Landing {

  constructor(private router: Router) {}

  goToLogin() {
    this.router.navigate(['/login']);
  }

}