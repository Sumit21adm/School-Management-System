import { IsString, IsEnum, IsBoolean } from 'class-validator';

export class LinkGuardianDto {
  @IsString()
  guardianId: string;

  @IsEnum(['father', 'mother', 'guardian', 'other'])
  relation: string;

  @IsBoolean()
  isPrimary: boolean;
}
