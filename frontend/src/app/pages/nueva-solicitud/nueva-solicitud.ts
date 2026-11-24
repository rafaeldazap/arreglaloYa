import { Component, inject, OnInit, signal } from '@angular/core';
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
  trabajadorId?: number;
  categoria = '';
  descripcion = '';
  zona = '';
  direccion = '';
  fecha = '';
  montoOfrecido: number | null = null;
  fotos = signal<string[]>([]);
  error = signal('');

  ngOnInit() {
    const id = Number(this.ruta.snapshot.queryParamMap.get('trabajador'));
    const t = this.datos.obtenerTrabajador(id);
    if (t) {
      this.trabajador = t.nombre;
      this.trabajadorId = t.id;
      this.categoria = t.especialidades[0];
    }
  }

  cargarFotos(evento: Event) {
    const archivos = (evento.target as HTMLInputElement).files;
    if (!archivos) return;
    for (const archivo of Array.from(archivos)) {
      if (this.fotos().length >= 5) {
        this.error.set('Puedes subir como máximo 5 fotos.');
        break;
      }
      achicarFoto(archivo).then((foto) => this.fotos.update((lista) => (lista.length < 5 ? [...lista, foto] : lista)));
    }
  }

  quitarFoto(i: number) {
    this.fotos.update((lista) => lista.filter((_, j) => j !== i));
  }

  async publicar() {
    if (!this.categoria || !this.descripcion || !this.zona || !this.direccion || !this.fecha) {
      this.error.set('Completa la categoría, la descripción, la zona, la dirección y la fecha.');
      return;
    }
    if (this.fotos().length === 0) {
      this.error.set('Sube al menos una foto del problema.');
      return;
    }
    const error = await this.datos.crearPedido({
      cliente: this.auth.usuario()!.nombre,
      categoria: this.categoria,
      descripcion: this.descripcion,
      zona: this.zona,
      direccion: this.direccion,
      fecha: this.fecha,
      montoOfrecido: this.montoOfrecido ?? 0,
      fotos: this.fotos(),
      trabajador: this.trabajador || undefined,
      trabajadorId: this.trabajadorId,
    });
    if (error) this.error.set(error);
    else this.router.navigate(['/mis-pedidos']);
  }
}

// Reduce la foto a máximo 800 px y la convierte a JPEG (≈ 50-100 KB) para enviarla al backend
function achicarFoto(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = reject;
    lector.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const escala = Math.min(1, 800 / Math.max(img.width, img.height));
        const lienzo = document.createElement('canvas');
        lienzo.width = Math.round(img.width * escala);
        lienzo.height = Math.round(img.height * escala);
        lienzo.getContext('2d')!.drawImage(img, 0, 0, lienzo.width, lienzo.height);
        resolve(lienzo.toDataURL('image/jpeg', 0.7));
      };
      img.src = lector.result as string;
    };
    lector.readAsDataURL(archivo);
  });
}
