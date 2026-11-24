import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatosService } from '../../services/datos.service';

@Component({
  selector: 'app-perfil-trabajador',
  imports: [RouterLink],
  templateUrl: './perfil-trabajador.html',
  styleUrl: './perfil-trabajador.css',
})
export class PerfilTrabajador {
  private datos = inject(DatosService);
  private ruta = inject(ActivatedRoute);
  private id = Number(this.ruta.snapshot.paramMap.get('id'));
  // computed: si los datos llegan después desde el backend, la pantalla se actualiza sola
  trabajador = computed(() => this.datos.obtenerTrabajador(this.id));

  estrellas(n: number): string {
    return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
  }
}
