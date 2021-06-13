import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import BaseEntity from '@/common/domains/BaseEntity';
import { ArrayNotEmpty, IsArray, IsBoolean, IsOptional, ValidateIf } from 'class-validator';
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
    @Type(() => Meaning)
    meanings: Meaning[];

    @Column({ type: 'uuid', array: true })
    @ValidateIf((vocabulary) => vocabulary.isDraft === false)
    @ArrayNotEmpty()
    @IsOptional()
    meaningIds: string[];

    @ManyToOne(() => Cohort, (cohort) => cohort.id, { eager: false, cascade: false })
    cohort?: Cohort;
}
