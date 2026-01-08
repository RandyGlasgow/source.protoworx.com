import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class VerifiedUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!user.auth?.emailVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    return true;
  }
}
