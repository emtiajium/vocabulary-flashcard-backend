import BaseEntity from '@/common/domains/BaseEntity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { Expose } from 'class-transformer';
import Cohort from '@/user/domains/Cohort';
import { ApiHideProperty } from '@nestjs/swagger';

@Entity('User')
export default class User extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    username: string;

    @Column({ type: 'varchar' })
    @IsString()
    @IsNotEmpty()
    firstname: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    lastname?: string;

    @Column({ type: 'varchar', nullable: true })
    @IsUrl()
    @IsString()
    @IsOptional()
    profilePictureUrl?: string;

    @ApiHideProperty()
    @IsOptional()
    @ManyToOne(() => Cohort, (cohort) => cohort.id, { nullable: true, eager: true, cascade: true })
    cohort?: Cohort;

    @Expose()
    get name(): string {
        return `${this.firstname} ${this.lastname || ''}`.trim();
    }

    @Expose()
    get cohortId(): string {
        return this.cohort?.id || '';
    }

    @Expose()
    get cohortName(): string {
        return this.cohort?.name || '';
    }
}
