import { IsDate, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
import { Type } from 'class-transformer';
import { ApiHideProperty } from '@nestjs/swagger';

export default abstract class BaseEntity {
    @ApiHideProperty()
    @PrimaryGeneratedColumn('uuid')
    @IsUUID()
    @IsOptional()
    id?: string;

    @ApiHideProperty()
    @CreateDateColumn({ type: 'timestamp with time zone' })
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    createdAt?: Date;

    @ApiHideProperty()
    @UpdateDateColumn({ type: 'timestamp with time zone' })
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    updatedAt?: Date;

    @ApiHideProperty()
    @VersionColumn()
    @IsNumber()
    @IsOptional()
    version?: number;
}
