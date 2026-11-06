import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Rol } from '../../models';
import { AuthService } from '../../services/auth.service';
import { DatosService } from '../../services/datos.service';

@Component({
  selector: 'app-registro',
  imports: [FormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  datos = inject(DatosService);
  private auth = inject(AuthService);
  private router = inject(Router);

  rol: Rol = 'CLIENTE';
  nombre = '';
  correo = '';
  telefono = '';
  password = '';
  ci = '';
  especialidades: string[] = [];
  zonas: string[] = [];
  error = '';
  enviado = false;

  marcar(lista: string[], valor: string) {
    const i = lista.indexOf(valor);
    if (i >= 0) lista.splice(i, 1);
    else lista.push(valor);
  }

  registrar() {
    this.error = '';
    if (!this.nombre || !this.correo.includes('@') || this.password.length < 6) {
      this.error = 'Completa nombre, un correo válido y una contraseña de al menos 6 caracteres.';
      return;
    }
    if (this.rol === 'TRABAJADOR') {
      if (!this.ci || this.especialidades.length === 0 || this.zonas.length === 0) {
        this.error = 'Indica tu CI, al menos una especialidad y una zona.';
        return;
      }
      this.enviado = true;
      return;
    }
    this.auth.registrar(this.nombre, this.correo, this.rol);
    this.router.navigate(['/buscar']);
  }
}
