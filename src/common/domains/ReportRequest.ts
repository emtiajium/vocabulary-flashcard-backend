import { IsNotEmpty } from 'class-validator';
import IsEqualToByConfig from '@/common/validations/IsEqualToByConfig';

export default class ReportRequest {
    @IsEqualToByConfig('GENERATING_REPORT_SECRET')
    @IsNotEmpty()
    secret: string;
}
