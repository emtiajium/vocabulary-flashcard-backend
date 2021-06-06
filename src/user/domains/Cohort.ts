import BaseEntity from '@/user/domains/BaseEntity';
import { Column, Entity, OneToMany } from 'typeorm';
import User from '@/user/domains/User';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export const cohortNameSize = 36;

@Entity('Cohort')
export default class Cohort extends BaseEntity {
    @MaxLength(cohortNameSize)
    @IsNotEmpty()
    @IsString()
    @Column({ type: 'varchar', unique: true })
    name: string;

    @Column({ type: 'uuid', array: true })
    // why do we need it?
    userIds?: string[];

    @IsArray()
    @Type(() => User)
    @OneToMany(() => User, (user) => user.cohort, { eager: false, cascade: false })
    users: User[];
}
