import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import BaseEntity from '@/common/domains/BaseEntity';
import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsDefined,
    IsNotEmpty,
    IsOptional,
    IsUUID,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import Meaning from '@/vocabulary/domains/Meaning';
import { Type } from 'class-transformer';
import Cohort from '@/user/domains/Cohort';

@Entity('Vocabulary')
export default class Vocabulary extends BaseEntity {
    @Column({ type: 'varchar', array: true })
    @IsArray()
    @IsOptional()
    genericNotes?: string[];

    @Column({ type: 'varchar', array: true })
    @IsArray()
    @IsOptional()
    genericExternalLinks?: string[];

    @Column({ type: 'varchar', array: true })
    @IsArray()
    @IsOptional()
    linkerWords?: string[];

    @Column({ type: 'boolean' })
    @IsBoolean()
    isDraft: boolean;

    @OneToMany(() => Meaning, (meaning) => meaning.id, { eager: true, cascade: true })
    @ValidateIf((vocabulary) => vocabulary.isDraft === false)
    @ValidateNested({ each: true })
    @ArrayNotEmpty()
    @Type(() => Meaning)
    meanings?: Meaning[];

    @Column({ type: 'uuid', array: true })
    @IsOptional()
    meaningIds?: string[];

    @ManyToOne(() => Cohort, (cohort) => cohort.id, { eager: false, cascade: false })
    @IsOptional()
    @Type(() => Cohort)
    cohort?: Cohort;

    @IsUUID()
    @IsNotEmpty()
    cohortId: string;
}
