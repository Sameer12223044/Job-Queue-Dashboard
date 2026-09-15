import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
  ParseUUIDPipe,
} from "@nestjs/common";
import { JobsService } from "./jobs.service";
import { CreateJobDto } from "./dto/create-job.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { JobStatus } from "./job.entity";

@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateJobDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.jobsService.create(dto, idempotencyKey);
  }

  @Get()
  findAll(@Query("status") status?: JobStatus) {
    return this.jobsService.findAll(status);
  }

  @Get("counts")
  getCounts() {
    return this.jobsService.getStatusCounts();
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.jobsService.updateStatus(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.jobsService.remove(id);
  }
}
