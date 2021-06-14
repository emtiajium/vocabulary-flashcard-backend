import BaseEntity from '@/common/domains/BaseEntity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { ArrayNotEmpty, IsArray, IsDefined, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import { Type } from 'class-transformer';
import { v4 as uuidV4 } from 'uuid';

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

    // eslint-disable-next-line complexity
    static create(vocabularyId: string, meaning?: Meaning): Meaning {
        const meaningInstance = new Meaning();
        meaningInstance.id = meaning?.id || uuidV4();
        meaningInstance.vocabularyId = vocabularyId;
        meaningInstance.meaning = meaning?.meaning || '';
        meaningInstance.examples = meaning?.examples || [];
        meaningInstance.notes = meaning?.notes || [];
        meaningInstance.externalLinks = meaning?.externalLinks || [];
        return meaningInstance;
    }
}
