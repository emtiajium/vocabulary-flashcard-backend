import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
import { Type } from 'class-transformer';
import { ApiHideProperty } from '@nestjs/swagger';

export default abstract class BaseEntity {
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
    @VersionColumn({ default: 1 })
    @IsNumber()
    @IsOptional()
    version?: number;
}
