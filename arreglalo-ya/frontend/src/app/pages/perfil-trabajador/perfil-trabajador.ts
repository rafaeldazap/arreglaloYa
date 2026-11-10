import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Trabajador } from '../../models';
import { DatosService } from '../../services/datos.service';

@Component({
  selector: 'app-perfil-trabajador',
  imports: [RouterLink],
  templateUrl: './perfil-trabajador.html',
  styleUrl: './perfil-trabajador.css',
})
export class PerfilTrabajador implements OnInit {
  private datos = inject(DatosService);
  private ruta = inject(ActivatedRoute);
  trabajador?: Trabajador;

  ngOnInit() {
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    this.trabajador = this.datos.obtenerTrabajador(id);
  }

  estrellas(n: number): string {
    return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
  }
}
