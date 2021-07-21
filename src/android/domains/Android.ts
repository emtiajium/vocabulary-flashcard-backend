import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { v4 as uuidV4 } from 'uuid';

@Entity('Android')
export default class Android {
    @PrimaryGeneratedColumn('uuid')
    @IsUUID()
    @IsOptional()
    id?: string;

    @Column({ type: 'int', nullable: false })
    @IsNotEmpty()
    @IsPositive()
    versionCode: number;

    @Column({ type: 'varchar', nullable: false })
    @IsNotEmpty()
    @IsString()
    versionName: string;

    @IsNotEmpty()
    @IsString()
    secret: string;

    static create(payload: Android, id: string): Android {
        const android = new Android();
        android.id = id || uuidV4();
        android.versionCode = payload.versionCode;
        android.versionName = payload.versionName;
        return android;
    }
}
