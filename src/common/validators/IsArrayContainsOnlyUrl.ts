import { isDefined, isURL, registerDecorator } from 'class-validator';
import { ObjectLiteral } from '@/common/types/ObjectLiteral';

export default function IsArrayContainsOnlyUrl<T>(): PropertyDecorator {
    return function validator(object: ObjectLiteral, propertyName: string): void {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: { message: `${propertyName} must contains only URLs` },
            constraints: [],
            validator: {
                validate(values: T[]): boolean {
                    if (isDefined(values) && !Array.isArray(values)) {
                        return false;
                    }
                    let isContainUrl = true;
                    values.forEach((value) => {
                        isContainUrl = isContainUrl && isURL(value as unknown as string);
                    });
                    return isContainUrl;
                },
            },
        });
    };
}
