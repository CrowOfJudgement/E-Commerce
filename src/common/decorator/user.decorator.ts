import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ name: 'CustomKey', async: false })
export class CustomKey implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (value !== (args.object as any)[args.constraints[0]]) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} not match with ${args.constraints[0]}`;
  }
}

export function IsMatch(constraints: string[], validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: constraints,
      validator: CustomKey,
    });
  };
}

export const User = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return data ? request.user?.[data as string] : request.user;
});
