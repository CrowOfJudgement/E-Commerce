import { ValidationArguments, ValidationOptions, registerDecorator } from 'class-validator';

export function IsMatch(requiredFields: string[], validationOptions?: ValidationOptions) {
  return function (constructor: Function) {
    registerDecorator({
      target: constructor,
      propertyName: '',
      options: validationOptions,
      constraints: requiredFields,
      validator: {
        validate(value: string, args: ValidationArguments) {
          return requiredFields.some((field) => (args.object as any)[field]);
        },
        defaultMessage(args: ValidationArguments) {
          return `At least one of required fields of ${requiredFields}`;
        },
      },
    });
  };
}

export const AtLeastOne = IsMatch;
