import { buildMessage, isString, registerDecorator } from 'class-validator';
import { ConfigService } from '@nestjs/config';

export default function IsEqualToByConfig(envVarName: string): PropertyDecorator {
    return (object: unknown, propertyName: string): void => {
        registerDecorator({
            name: 'IsEqualToByConfig',
            target: object.constructor,
            propertyName,
            validator: {
                validate(value: string): boolean {
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
