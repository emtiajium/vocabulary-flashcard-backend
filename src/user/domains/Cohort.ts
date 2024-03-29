import BaseEntityWithoutMandatoryId from '@/common/persistence/BaseEntityWithoutMandatoryId';
import { Column, Entity, OneToMany, Unique } from 'typeorm';
import User from '@/user/domains/User';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import { ApiHideProperty } from '@nestjs/swagger';

export const cohortNameSize = 36;
export const defaultName = 'Wolverine';

@Entity('Cohort')
@Unique(['name'])
export default class Cohort extends BaseEntityWithoutMandatoryId {
    @MaxLength(cohortNameSize)
    @IsNotEmpty()
    @IsString()
    @Column({ type: 'varchar' })
    name: string;

    @IsEmail(undefined, { each: true })
    @IsArray()
    @IsOptional()
    usernames?: string[];

    @ApiHideProperty()
    @IsArray()
    @IsOptional()
    @Type(() => User)
    @OneToMany(() => User, (user) => user.cohort, { eager: false, cascade: false })
    users?: User[];

    @ApiHideProperty()
    @IsArray()
    @IsOptional()
    @Type(() => Vocabulary)
    @OneToMany(() => Vocabulary, (vocabulary) => vocabulary.cohort, { eager: false, cascade: false })
    vocabularies?: Vocabulary[];
}
