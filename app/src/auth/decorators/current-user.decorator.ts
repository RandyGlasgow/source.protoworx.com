import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as Prisma.UserGetPayload<{ include: { auth: true } }>;
  },
);
