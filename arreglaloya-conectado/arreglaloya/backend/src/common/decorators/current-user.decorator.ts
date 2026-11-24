import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Usuario } from '../../entities/Usuario';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Usuario => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
