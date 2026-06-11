import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { isValidFlexibleDate } from '../utils/date.util';

@ValidatorConstraint({ name: 'isFlexibleDate', async: false })
export class IsFlexibleDateConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments): boolean {
    if (value === null || value === undefined) return true; // handled by @IsOptional
    if (typeof value !== 'string') return false;
    return isValidFlexibleDate(value);
  }

  defaultMessage(_args: ValidationArguments): string {
    return (
      'Date must be in a recognised format: DDMMYY, MMDDYY, YYMMDD, ' +
      'DDMMYYYY, MMDDYYYY, YYYYMMDD, DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD'
    );
  }
}

/**
 * Validates that the decorated string property is parseable as a date in any
 * supported format. Combine with @Transform to normalize the stored value.
 *
 * @example
 *   @IsOptional()
 *   @IsFlexibleDate()
 *   dateOfBirth?: string;
 */
export function IsFlexibleDate(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsFlexibleDateConstraint,
    });
  };
}
