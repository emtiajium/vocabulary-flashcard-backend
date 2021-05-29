import BaseEntity from '@/user/domains/BaseEntity';
import { Column, Entity } from 'typeorm';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export const usernameSize = 36;
export const firstnameSize = 36;
export const lastnameSize = 36;
export const profilePictureUrlSize = 100;

@Entity('User')
export default class User extends BaseEntity {
    @Column({ type: 'varchar' })
    @MaxLength(usernameSize)
    @IsString()
    @IsNotEmpty()
    username: string;

    @Column({ type: 'varchar' })
    @MaxLength(firstnameSize)
    @IsString()
    @IsNotEmpty()
    firstname: string;

    @Column({ type: 'varchar' })
    @MaxLength(lastnameSize)
    @IsString()
    @IsNotEmpty()
    lastname: string;

    @Column({ type: 'varchar' })
    @MaxLength(profilePictureUrlSize)
    @IsString()
    @IsNotEmpty()
    profilePictureUrl: string;

    get name(): string {
        return `${this.firstname} ${this.lastname || ''}`.trim();
    }
}
