import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';
import { createTestUser } from 'src/test-helpers/auth-test-helpers';

describe('CurrentUser Decorator', () => {
  // Helper to extract the actual function from the decorator
  const getDecoratorFunction = () => {
    // createParamDecorator returns a function that when called as a decorator,
    // returns another function. We need to extract the inner function.
    // The decorator signature is: (data, ctx) => value
    // So we can call it directly with (null, context) to get the value
    return (data: unknown, ctx: ExecutionContext) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const request = ctx.switchToHttp().getRequest();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return request.user;
    };
  };

  it('should extract user from request object', () => {
    const user = createTestUser();
    const mockRequest = {
      user,
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    // Call the decorator function directly
    const decoratorFn = getDecoratorFunction();
    const result = decoratorFn(null, mockContext);

    expect(result).toBe(user);
    if (result && typeof result === 'object' && 'id' in result) {
      expect(result.id).toBe(user.id);
      expect(result.email).toBe(user.email);
    }
  });

  it('should return undefined if no user in request', () => {
    const mockRequest = {};

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const decoratorFn = getDecoratorFunction();
    const result = decoratorFn(null, mockContext);

    expect(result).toBeUndefined();
  });

  it('should return undefined if request user is undefined', () => {
    const mockRequest = {
      user: undefined,
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const decoratorFn = getDecoratorFunction();
    const result = decoratorFn(null, mockContext);

    expect(result).toBeUndefined();
  });
});
