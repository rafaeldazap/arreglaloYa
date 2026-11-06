import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstadoPedido, Pedido } from '../../models';
import { AuthService } from '../../services/auth.service';
import { DatosService } from '../../services/datos.service';

@Component({
  selector: 'app-mis-pedidos',
  imports: [RouterLink],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css',
})
export class MisPedidos {
  datos = inject(DatosService);
  auth = inject(AuthService);
  pasos: EstadoPedido[] = ['PENDIENTE', 'APROBADO', 'EN_PROCESO', 'FINALIZADO'];

  nombres: Record<EstadoPedido, string> = {
    PENDIENTE: 'Pendiente',
    APROBADO: 'Aprobado',
    EN_PROCESO: 'En proceso',
    FINALIZADO: 'Finalizado',
    CANCELADO: 'Cancelado',
    FUERA_DE_TIEMPO: 'Fuera de tiempo',
  };

  pasoCompletado(pedido: Pedido, paso: EstadoPedido): boolean {
    return this.pasos.indexOf(paso) <= this.pasos.indexOf(pedido.estado);
  }

  puedeCancelar(pedido: Pedido): boolean {
    return pedido.estado === 'PENDIENTE' || pedido.estado === 'APROBADO';
  }

  cancelar(pedido: Pedido) {
    if (confirm('¿Seguro que quieres cancelar esta solicitud?')) {
      this.datos.cancelarPedido(pedido.id);
    }
  }
}
