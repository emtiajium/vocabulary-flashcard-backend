import BaseEntity from '@/common/domains/BaseEntity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { ArrayNotEmpty, IsArray, IsDefined, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import { Type } from 'class-transformer';

@Entity('Meaning')
export default class Meaning extends BaseEntity {
    @Column({ type: 'varchar', default: '' })
    @IsNotEmpty()
    @IsString()
    @IsDefined()
    meaning: string;

    @Column({ type: 'varchar', array: true, default: [] })
    @ArrayNotEmpty()
    @IsArray()
    @IsDefined()
    examples?: string[];

    @Column({ type: 'varchar', array: true, default: [] })
    @IsArray()
    @IsOptional()
    notes?: string[];

    @Column({ type: 'varchar', array: true, default: [] })
    // TODO add validation for the URLs
    @IsArray()
    @IsOptional()
    externalLinks?: string[];

    @Type(() => Vocabulary)
    @ManyToOne(() => Vocabulary, (vocabulary) => vocabulary.id, { eager: false, cascade: true })
    vocabulary?: Vocabulary;

    @Column({ type: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    vocabularyId: string;
}
