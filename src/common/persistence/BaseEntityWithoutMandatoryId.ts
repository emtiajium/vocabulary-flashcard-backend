import { IsOptional, IsUUID } from 'class-validator';
import { PrimaryGeneratedColumn } from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';
import BaseEntity from '@/common/persistence/BaseEntity';

export default abstract class BaseEntityWithoutMandatoryId extends BaseEntity {
    @ApiHideProperty()
    @PrimaryGeneratedColumn('uuid')
    @IsUUID()
    @IsOptional()
    id?: string;
}
