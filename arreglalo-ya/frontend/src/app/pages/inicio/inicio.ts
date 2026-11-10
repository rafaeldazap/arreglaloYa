import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatosService } from '../../services/datos.service';

@Component({
  selector: 'app-inicio',
  imports: [FormsModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  datos = inject(DatosService);
  private router = inject(Router);
  categoria = '';
  zona = '';

  buscar() {
    this.router.navigate(['/buscar'], { queryParams: { categoria: this.categoria, zona: this.zona } });
  }

  elegirCategoria(c: string) {
    this.categoria = c;
    this.buscar();
  }
}
