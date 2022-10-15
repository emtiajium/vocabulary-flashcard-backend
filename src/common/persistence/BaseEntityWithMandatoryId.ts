import { IsDefined, IsNotEmpty, IsUUID } from 'class-validator';
import { PrimaryGeneratedColumn } from 'typeorm';
import BaseEntity from '@/common/persistence/BaseEntity';

export default abstract class BaseEntityWithMandatoryId extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    @IsUUID()
    @IsNotEmpty()
    @IsDefined()
    id: string;
}
