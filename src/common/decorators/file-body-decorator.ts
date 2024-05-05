import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UploadedFile = createParamDecorator(
  (property: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (property) {
      return request.file(property);
    }
    return request.file;
  },
);
