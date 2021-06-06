import BaseEntity from '@/user/domains/BaseEntity';
import { Column, Entity, ManyToOne } from 'typeorm';
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

    @IsArray()
    @Type(() => User)
    @ManyToOne(() => User, (user) => user.cohort, { nullable: true, eager: false, cascade: false })
    @Column({ type: 'varchar', array: true })
    users: User[];
}
