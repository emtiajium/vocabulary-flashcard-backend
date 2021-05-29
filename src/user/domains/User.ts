import BaseEntity from '@/user/domains/BaseEntity';
import { Column, Entity } from 'typeorm';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Expose } from 'class-transformer';

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
    @MaxLength(profilePictureUrlSize)
    @IsString()
    @IsOptional()
    profilePictureUrl?: string;

    @Expose()
    get name(): string {
        return `${this.firstname} ${this.lastname || ''}`.trim();
    }
}
