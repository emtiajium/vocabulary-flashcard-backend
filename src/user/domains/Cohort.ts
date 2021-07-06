import BaseEntity from '@/common/domains/BaseEntity';
import { Column, Entity, OneToMany } from 'typeorm';
import User from '@/user/domains/User';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import Vocabulary from '@/vocabulary/domains/Vocabulary';

export const cohortNameSize = 36;
export const defaultName = 'Wolverine';

@Entity('Cohort')
export default class Cohort extends BaseEntity {
    @MaxLength(cohortNameSize)
    @IsNotEmpty()
    @IsString()
    @Column({ type: 'varchar', unique: true })
    name: string;

    @IsUUID(undefined, { each: true })
    @IsOptional()
    // why do we need it?
    userIds?: string[];

    @IsArray()
    @IsOptional()
    @Type(() => User)
    @OneToMany(() => User, (user) => user.cohort, { eager: false, cascade: false })
    users?: User[];

    @IsArray()
    @IsOptional()
    @Type(() => Vocabulary)
    @OneToMany(() => Vocabulary, (vocabulary) => vocabulary.cohort, { eager: false, cascade: false })
    vocabularies?: Vocabulary[];
}
