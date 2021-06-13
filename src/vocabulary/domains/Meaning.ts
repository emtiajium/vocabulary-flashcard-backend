import BaseEntity from '@/common/domains/BaseEntity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { IsArray, IsOptional, ValidateIf } from 'class-validator';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import { Type } from 'class-transformer';

@Entity('Meaning')
export default class Meaning extends BaseEntity {
    @Column({ type: 'varchar', array: true })
    @ValidateIf((vocabulary) => vocabulary.isDraft === false)
    @IsArray()
    @IsOptional()
    examples?: string[];

    @Column({ type: 'varchar', array: true })
    @ValidateIf((vocabulary) => vocabulary.isDraft === false)
    @IsArray()
    @IsOptional()
    notes?: string[];

    @Column({ type: 'varchar', array: true })
    @ValidateIf((vocabulary) => vocabulary.isDraft === false)
    @IsArray()
    @IsOptional()
    externalLinks?: string[];

    @Type(() => Vocabulary)
    @ManyToOne(() => Vocabulary, (vocabulary) => vocabulary.id, { eager: false, cascade: true })
    vocabulary?: Vocabulary;
}
