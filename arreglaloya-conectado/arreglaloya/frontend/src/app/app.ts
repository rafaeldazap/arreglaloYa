import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { DatosService } from './services/datos.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  auth = inject(AuthService);
  datos = inject(DatosService);
  private router = inject(Router);
  menuAbierto = false;

  salir() {
    this.auth.cerrarSesion();
    this.router.navigate(['/']);
  }
}
