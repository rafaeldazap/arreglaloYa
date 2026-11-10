import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Trabajador } from '../../models';
import { DatosService } from '../../services/datos.service';

@Component({
  selector: 'app-buscar',
  imports: [FormsModule, RouterLink],
  templateUrl: './buscar.html',
  styleUrl: './buscar.css',
})
export class Buscar implements OnInit {
  datos = inject(DatosService);
  private ruta = inject(ActivatedRoute);
  categoria = '';
  zona = '';
  resultados: Trabajador[] = [];

  ngOnInit() {
    this.categoria = this.ruta.snapshot.queryParamMap.get('categoria') ?? '';
    this.zona = this.ruta.snapshot.queryParamMap.get('zona') ?? '';
    this.filtrar();
  }

  filtrar() {
    this.resultados = this.datos.obtenerTrabajadores(this.zona, this.categoria);
  }

  estrellas(n: number): string {
    return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
  }
}
