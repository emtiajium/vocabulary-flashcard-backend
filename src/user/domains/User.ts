import BaseEntityWithoutMandatoryId from '@/common/persistence/BaseEntityWithoutMandatoryId';
import { Column, Entity, ManyToOne, OneToMany, Unique } from 'typeorm';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { Expose } from 'class-transformer';
import Cohort from '@/user/domains/Cohort';
import { ApiHideProperty } from '@nestjs/swagger';
import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';

@Entity('User')
@Unique(['username'])
export default class User extends BaseEntityWithoutMandatoryId {
    @Column({ type: 'varchar' })
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
    @ManyToOne(() => Cohort, (cohort) => cohort.users, { nullable: true, eager: true, cascade: true })
    cohort?: Cohort;

    @ApiHideProperty()
    @IsOptional()
    @OneToMany(() => LeitnerSystems, (leitnerSystems) => leitnerSystems.user, {
        nullable: true,
        eager: false,
        cascade: false,
    })
    flashcards?: LeitnerSystems[];

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
