import { NotFoundException } from '@nestjs/common';

export default class EntityNotFoundException extends NotFoundException {
    constructor(readonly message: string) {
        super(message);
    }
}
