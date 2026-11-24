import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SolicitudesService } from './solicitudes.service';

@Injectable()
export class SolicitudesTasks {
  private readonly logger = new Logger(SolicitudesTasks.name);

  constructor(private readonly solicitudesService: SolicitudesService) {}

  // RN-08 / CU-11: Ejecución automática diaria a medianoche para caducar solicitudes > 30 días
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async procesarCaducidadAutomatica() {
    try {
      const resultado = await this.solicitudesService.expirarSolicitudesVencidas();
      if (resultado.totalExpiradas > 0) {
        this.logger.log(
          `Caducidad automática RN-08: ${resultado.totalExpiradas} solicitudes marcadas como FUERA_DE_TIEMPO.`,
        );
      }
    } catch (error) {
      this.logger.error('Error ejecutando tarea automática de caducidad RN-08', error);
    }
  }
}
