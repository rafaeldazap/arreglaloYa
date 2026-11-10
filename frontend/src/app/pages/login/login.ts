import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  correo = '';
  password = '';
  error = signal('');
  cargando = signal(false);

  ingresar() {
    this.error.set('');
    this.cargando.set(true);
    this.auth.iniciarSesion(this.correo, this.password).subscribe({
      next: () => this.router.navigate(['/mis-pedidos']),
      error: (err) => {
        this.error.set(this.auth.mensajeError(err));
        this.cargando.set(false);
      },
    });
  }
}
