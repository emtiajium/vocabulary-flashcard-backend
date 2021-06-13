import { IsDate, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

export default abstract class BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    @IsUUID()
    @IsOptional()
    id?: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    @IsDate()
    @IsOptional()
    createdAt?: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    @IsDate()
    @IsOptional()
    updatedAt?: Date;

    @VersionColumn()
    @IsNumber()
    @IsOptional()
    version?: number;
}
