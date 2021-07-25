import { Column, Entity } from 'typeorm';
import BaseEntity from '@/common/domains/BaseEntity';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import { IsDate, IsDefined, IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

// Big NO to foreign key concept

@Entity('LeitnerSystems')
export default class LeitnerSystems extends BaseEntity {
    @Column({ type: 'uuid', nullable: false })
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @Column({ type: 'uuid', nullable: false })
    @IsUUID()
    @IsNotEmpty()
    vocabularyId: string;

    @Column({ type: 'int', nullable: false })
    @IsDefined()
    @IsEnum(LeitnerBoxType)
    currentBox: LeitnerBoxType;

    @Column({ type: 'timestamp with time zone', nullable: false })
    @IsDate()
    @Type(() => Date)
    @IsDefined()
    boxAppearanceDate: Date;
}
