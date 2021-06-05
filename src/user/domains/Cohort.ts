import BaseEntity from '@/user/domains/BaseEntity';
import { Column, Entity, ManyToOne } from 'typeorm';
import User from '@/user/domains/User';
import { Type } from 'class-transformer';
import { IsArray } from 'class-validator';

@Entity('Cohort')
export default class Cohort extends BaseEntity {
    @IsArray()
    @Type(() => User)
    @ManyToOne(() => User, (user) => user.cohort)
    @Column({ type: 'jsonb' })
    users: User[];
}
