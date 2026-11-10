import { Component, inject, signal } from '@angular/core';
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
  error = signal('');
  enviado = signal(false);
  cargando = signal(false);

  marcar(lista: string[], valor: string) {
    const i = lista.indexOf(valor);
    if (i >= 0) lista.splice(i, 1);
    else lista.push(valor);
  }

  registrar() {
    this.error.set('');
    if (this.rol === 'TRABAJADOR' && (!this.ci || this.especialidades.length === 0 || this.zonas.length === 0)) {
      this.error.set('Indica tu CI, al menos una especialidad y una zona.');
      return;
    }
    this.cargando.set(true);
    this.auth
      .registrar({
        nombre: this.nombre,
        correo: this.correo,
        telefono: this.telefono,
        password: this.password,
        rol: this.rol === 'TRABAJADOR' ? 'TRABAJADOR' : 'CLIENTE',
        ...(this.rol === 'TRABAJADOR' && { ci: this.ci, especialidades: this.especialidades, zonas: this.zonas }),
      })
      .subscribe({
        next: () => {
          if (this.rol === 'TRABAJADOR') this.enviado.set(true);
          else this.router.navigate(['/buscar']);
        },
        error: (err) => {
          this.error.set(this.auth.mensajeError(err));
          this.cargando.set(false);
        },
      });
  }
}
