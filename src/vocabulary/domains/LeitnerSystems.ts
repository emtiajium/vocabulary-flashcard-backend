import { Column, Entity } from 'typeorm';
import BaseEntity from '@/common/domains/BaseEntity';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import { IsDate, IsDefined, IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import MomentUnit, { makeItNewer } from '@/common/utils/moment-util';
import LeitnerBoxAppearanceDifference from '@/vocabulary/domains/LeitnerBoxAppearanceDifference';

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

    static calculateNextBoxAppearanceDate(box: LeitnerBoxType): Date {
        let boxAppearanceDate: Date;
        switch (box) {
            case LeitnerBoxType.BOX_1: {
                boxAppearanceDate = new Date();
                break;
            }
            case LeitnerBoxType.BOX_2: {
                boxAppearanceDate = makeItNewer(new Date(), MomentUnit.DAYS, LeitnerBoxAppearanceDifference.BOX_2);
                break;
            }
            case LeitnerBoxType.BOX_3: {
                boxAppearanceDate = makeItNewer(new Date(), MomentUnit.DAYS, LeitnerBoxAppearanceDifference.BOX_3);
                break;
            }
            case LeitnerBoxType.BOX_4: {
                boxAppearanceDate = makeItNewer(new Date(), MomentUnit.DAYS, LeitnerBoxAppearanceDifference.BOX_4);
                break;
            }
            default: {
                // LeitnerBoxType.BOX_5
                boxAppearanceDate = new Date();
            }
        }
        return boxAppearanceDate;
    }

    static calculatePreviousBoxAppearanceDate(): Date {
        return new Date();
    }
}
