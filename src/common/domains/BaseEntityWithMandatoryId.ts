import { IsDate, IsDefined, IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export default abstract class BaseEntityWithMandatoryId {
    @PrimaryGeneratedColumn('uuid')
    @IsUUID()
    @IsNotEmpty()
    @IsDefined()
    id: string;

    @Type(() => Date)
    @ApiHideProperty()
    @CreateDateColumn({ type: 'timestamp with time zone' })
    @IsDate()
    @IsOptional()
    createdAt?: Date;

    @Type(() => Date)
    @ApiHideProperty()
    @UpdateDateColumn({ type: 'timestamp with time zone' })
    @IsDate()
    @IsOptional()
    updatedAt?: Date;

    @ApiHideProperty()
    @VersionColumn()
    @IsNumber()
    @IsOptional()
    version?: number;
}
