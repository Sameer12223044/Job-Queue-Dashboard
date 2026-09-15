import { IsEnum, IsString, MaxLength, MinLength } from "class-validator";
import { JobType } from "../job.entity";

export class CreateJobDto {
  @IsString()
  @MinLength(3, { message: "Title must be at least 3 characters" })
  @MaxLength(100, { message: "Title must be at most 100 characters" })
  title: string;

  @IsEnum(JobType, {
    message: `Type must be one of: ${Object.values(JobType).join(", ")}`,
  })
  type: JobType;
}
