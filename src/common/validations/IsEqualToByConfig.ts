import { buildMessage, isString, registerDecorator } from 'class-validator';
import { ConfigService } from '@nestjs/config';

export default function IsEqualToByConfig(envVarName: string): PropertyDecorator {
    return (object: object, propertyName: string | symbol): void => {
        registerDecorator({
            name: 'IsEqualToByConfig',
            target: object.constructor,
            propertyName: String(propertyName),
            validator: {
                validate(value: unknown): boolean {
                    if (!isString(value)) {
                        return false;
                    }

                    return value === new ConfigService().get(envVarName);
                },
                defaultMessage: buildMessage((eachPrefix) => `${eachPrefix}$property must be matched`),
            },
        });
    };
}
