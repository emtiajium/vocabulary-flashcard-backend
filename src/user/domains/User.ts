import BaseEntity from '@/user/domains/BaseEntity';
import { Column, Entity, OneToMany } from 'typeorm';
import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { Expose } from 'class-transformer';
import Cohort from '@/user/domains/Cohort';

export const usernameSize = 36;
export const firstnameSize = 36;
export const lastnameSize = 36;
export const profilePictureUrlSize = 100;

@Entity('User')
export default class User extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    @MaxLength(usernameSize)
    @IsString()
    @IsNotEmpty()
    username: string;

    @Column({ type: 'varchar' })
    @MaxLength(firstnameSize)
    @IsString()
    @IsNotEmpty()
    firstname: string;

    @Column({ type: 'varchar', nullable: true })
    @MaxLength(lastnameSize)
    @IsString()
    @IsOptional()
    lastname?: string;

    @Column({ type: 'varchar', nullable: true })
    @IsUrl()
    @MaxLength(profilePictureUrlSize)
    @IsString()
    @IsOptional()
    profilePictureUrl?: string;

    @OneToMany(() => Cohort, (cohort) => cohort.id, { eager: true, cascade: true })
    cohort?: Cohort;

    @Expose()
    get name(): string {
        return `${this.firstname} ${this.lastname || ''}`.trim();
    }

    @Expose()
    get cohortId(): string {
        return this.cohort?.id || '';
    }
}
