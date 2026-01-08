import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformResponseInterceptor } from './transform-response.interceptor';

describe('TransformResponseInterceptor', () => {
  let interceptor: TransformResponseInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransformResponseInterceptor],
    }).compile();

    interceptor = module.get<TransformResponseInterceptor>(
      TransformResponseInterceptor,
    );
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap plain data in success response', (done) => {
    const mockContext = {} as ExecutionContext;
    const mockHandler: CallHandler = {
      handle: () => of({ data: 'test' }),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: { data: 'test' },
      });
      done();
    });
  });

  it('should leave already-wrapped responses unchanged', (done) => {
    const mockContext = {} as ExecutionContext;
    const wrappedResponse = {
      success: true,
      data: { user: 'test' },
      message: 'Success',
    };
    const mockHandler: CallHandler = {
      handle: () => of(wrappedResponse),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual(wrappedResponse);
      done();
    });
  });

  it('should wrap null response', (done) => {
    const mockContext = {} as ExecutionContext;
    const mockHandler: CallHandler = {
      handle: () => of(null),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: null,
      });
      done();
    });
  });

  it('should wrap undefined response', (done) => {
    const mockContext = {} as ExecutionContext;
    const mockHandler: CallHandler = {
      handle: () => of(undefined),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: undefined,
      });
      done();
    });
  });

  it('should wrap object without success property', (done) => {
    const mockContext = {} as ExecutionContext;
    const response = { user: 'test', id: 123 };
    const mockHandler: CallHandler = {
      handle: () => of(response),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: response,
      });
      done();
    });
  });

  it('should not wrap object with success property', (done) => {
    const mockContext = {} as ExecutionContext;
    const response = { success: false, message: 'Error' };
    const mockHandler: CallHandler = {
      handle: () => of(response),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual(response);
      done();
    });
  });
});
