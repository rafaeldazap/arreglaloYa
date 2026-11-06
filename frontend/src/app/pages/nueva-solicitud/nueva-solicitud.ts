import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DatosService } from '../../services/datos.service';

@Component({
  selector: 'app-nueva-solicitud',
  imports: [FormsModule, RouterLink],
  templateUrl: './nueva-solicitud.html',
  styleUrl: './nueva-solicitud.css',
})
export class NuevaSolicitud implements OnInit {
  datos = inject(DatosService);
  auth = inject(AuthService);
  private ruta = inject(ActivatedRoute);
  private router = inject(Router);

  trabajador = '';
  categoria = '';
  descripcion = '';
  zona = '';
  direccion = '';
  fecha = '';
  montoOfrecido: number | null = null;
  fotos: string[] = [];
  error = '';

  ngOnInit() {
    const id = Number(this.ruta.snapshot.queryParamMap.get('trabajador'));
    const t = this.datos.obtenerTrabajador(id);
    if (t) {
      this.trabajador = t.nombre;
      this.categoria = t.especialidades[0];
    }
  }

  cargarFotos(evento: Event) {
    const archivos = (evento.target as HTMLInputElement).files;
    if (!archivos) return;
    for (const archivo of Array.from(archivos)) {
      if (this.fotos.length >= 5) {
        this.error = 'Puedes subir como máximo 5 fotos.';
        break;
      }
      const lector = new FileReader();
      lector.onload = () => this.fotos.push(lector.result as string);
      lector.readAsDataURL(archivo);
    }
  }

  quitarFoto(i: number) {
    this.fotos.splice(i, 1);
  }

  publicar() {
    if (!this.categoria || !this.descripcion || !this.zona || !this.direccion || !this.fecha) {
      this.error = 'Completa la categoría, la descripción, la zona, la dirección y la fecha.';
      return;
    }
    if (this.fotos.length === 0) {
      this.error = 'Sube al menos una foto del problema.';
      return;
    }
    this.datos.crearPedido({
      categoria: this.categoria,
      descripcion: this.descripcion,
      zona: this.zona,
      direccion: this.direccion,
      fecha: this.fecha,
      montoOfrecido: this.montoOfrecido ?? 0,
      fotos: this.fotos,
      trabajador: this.trabajador || undefined,
    });
    this.router.navigate(['/mis-pedidos']);
  }
}
