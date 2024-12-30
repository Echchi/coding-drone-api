import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean {
    console.log('AuthGuard Triggered');
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );
    console.log('Is Public Route:', isPublic);
    if (isPublic) {
      return true; // 인증 제외
    }
    const request = context.switchToHttp().getRequest();
    console.log('Authorization Header:', request.headers.authorization);
    return super.canActivate(context) as boolean;
  }
}
