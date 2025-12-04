import { IsArray, IsBoolean, IsInt, IsString } from 'class-validator';

export class PromoteStudentsDto {
  @IsArray()
  @IsInt({ each: true })
  studentIds: number[];

  @IsInt()
  currentSessionId: number;

  @IsInt()
  nextSessionId: number;

  @IsString()
  nextClass: string;

  @IsString()
  nextSection: string;

  @IsBoolean()
  markAsPassout: boolean;
}
