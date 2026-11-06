import { Component, inject } from '@angular/core';
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
  error = '';

  ingresar() {
    if (this.auth.iniciarSesion(this.correo, this.password)) {
      this.router.navigate(['/mis-pedidos']);
    } else {
      this.error = 'Correo o contraseña no válidos (mínimo 6 caracteres).';
    }
  }
}
