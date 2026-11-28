import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EscalamientoService } from './escalamiento.service';

@Injectable()
export class EscalamientoTasks {
  private readonly logger = new Logger(EscalamientoTasks.name);

  constructor(private readonly escalamientoService: EscalamientoService) {}

  // Cada 5 minutos se escalan los reclamos que superaron el plazo configurado
  @Cron(CronExpression.EVERY_5_MINUTES)
  async escalarVencidos() {
    try {
      await this.escalamientoService.verificarVencidos();
    } catch (error) {
      this.logger.error('Error ejecutando el escalamiento automático de reclamos', error);
    }
  }
}
