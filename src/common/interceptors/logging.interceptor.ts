import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    const { method, url, ip } = request;
    const userAgent = request.headers['user-agent'] || '';
    
    // In actual auth implementations, request.user will be populated by JWT passport strategy
    const userId = request.user?.id || null;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const statusCode = response.statusCode;
        const delay = Date.now() - now;
        
        this.loggerService.success(
          `${method} ${url} ${statusCode} - ${delay}ms`,
          'HTTP-Request',
          userId,
          {
            ip,
            userAgent,
            method,
            url,
            statusCode,
            duration: delay,
          },
        );
      }),
      catchError((error) => {
        const statusCode = error.status || 500;
        const delay = Date.now() - now;

        this.loggerService.error(
          `${method} ${url} ${statusCode} - ${delay}ms - Error: ${error.message}`,
          'HTTP-Request-Error',
          userId,
          {
            ip,
            userAgent,
            method,
            url,
            statusCode,
            duration: delay,
            stack: error.stack,
            response: error.response,
          },
        );

        return throwError(() => error);
      }),
    );
  }
}
