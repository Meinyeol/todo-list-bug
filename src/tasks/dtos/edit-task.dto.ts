import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class EditTaskDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    done?: boolean;

    @IsOptional()
    @IsDateString()
    dueDate?: string;
}
