import { IsNotEmpty } from 'class-validator';

export default class ReportRequest {
    @IsNotEmpty()
    secret: string;
}
