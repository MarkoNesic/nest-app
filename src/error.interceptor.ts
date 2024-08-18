import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Logger } from '@nestjs/common';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  private logger = new Logger('ErrorInterceptor');
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        this.logger.error(`Error occurred: ${error.message}`, error.stack);
        return throwError(error);
      }),
    );
  }
}
