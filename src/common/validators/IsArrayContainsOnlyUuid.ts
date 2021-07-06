import { isDefined, isUUID, registerDecorator } from 'class-validator';
import { ObjectLiteral } from '@/common/types/ObjectLiteral';

// TODO remove it
// equivalent to @IsUUID(undefined, { each: true })

export default function IsArrayContainsOnlyUuid<T>(): PropertyDecorator {
    return function validator(object: ObjectLiteral, propertyName: string): void {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: { message: `${propertyName} must contains only UUIDs` },
            constraints: [],
            validator: {
                validate(values: T[]): boolean {
                    if (!isDefined(values) || !Array.isArray(values)) {
                        return false;
                    }
                    let isContainUUID = true;
                    values.forEach((value) => {
                        isContainUUID = isContainUUID && isUUID(value);
                    });
                    return isContainUUID;
                },
            },
        });
    };
}
