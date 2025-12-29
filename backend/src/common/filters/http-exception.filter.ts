import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | any;
    if (exception instanceof HttpException) {
      message = exception.getResponse();
    } else {
      // Log the actual error for debugging
      console.error('Unhandled exception:', exception);
      if (exception instanceof Error) {
        console.error('Error message:', exception.message);
        console.error('Error stack:', exception.stack);
        message = exception.message || 'Internal server error';
      } else {
        message = 'Internal server error';
      }
    }

    const errorMessage = typeof message === 'string' ? message : (message as any).message || (message as any).error || 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorMessage,
    });
  }
}

