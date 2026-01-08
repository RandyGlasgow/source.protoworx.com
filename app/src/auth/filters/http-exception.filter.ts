import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        message =
          typeof exceptionResponse.message === 'string'
            ? exceptionResponse.message
            : Array.isArray(exceptionResponse.message)
              ? exceptionResponse.message.join(', ')
              : 'An error occurred';
      }
    }

    const responseBody: {
      success: boolean;
      message: string;
      errors?: unknown;
    } = {
      success: false,
      message,
    };

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'errors' in exceptionResponse
      ) {
        responseBody.errors = (exceptionResponse as { errors: unknown }).errors;
      }
    }

    response.status(status).json(responseBody);
  }
}
