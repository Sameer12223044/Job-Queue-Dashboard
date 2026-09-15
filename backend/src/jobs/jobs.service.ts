import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Job, JobStatus, JobType } from "./job.entity";
import { CreateJobDto } from "./dto/create-job.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";

/** Allowed state transitions */
const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.PENDING]: [JobStatus.RUNNING],
  [JobStatus.RUNNING]: [JobStatus.COMPLETED, JobStatus.FAILED],
  [JobStatus.COMPLETED]: [],
  [JobStatus.FAILED]: [],
};

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepo: Repository<Job>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateJobDto, idempotencyKey?: string): Promise<Job> {
    // Bonus: idempotency — if we've already created a job for this key, return it
    if (idempotencyKey) {
      const existing = await this.jobsRepo.findOne({
        where: { id: idempotencyKey },
      });
      if (existing) return existing;
    }

    const job = this.jobsRepo.create({
      id: idempotencyKey ?? uuidv4(),
      title: dto.title,
      type: dto.type as JobType,
      status: JobStatus.PENDING,
    });
    return this.jobsRepo.save(job);
  }

  async findAll(status?: JobStatus): Promise<Job[]> {
    if (status) {
      return this.jobsRepo.find({
        where: { status },
        order: { createdAt: "DESC" },
      });
    }
    return this.jobsRepo.find({ order: { createdAt: "DESC" } });
  }

  async findOne(id: string): Promise<Job> {
    const job = await this.jobsRepo.findOne({ where: { id } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  /**
   * Update status with:
   *  1. Transition validation (business rule)
   *  2. Pessimistic write lock inside a transaction (concurrency safety)
   */
  async updateStatus(id: string, dto: UpdateStatusDto): Promise<Job> {
    return this.dataSource.transaction(async (manager) => {
      // Pessimistic lock: only one concurrent request can hold this lock at a time
      const job = await manager.findOne(Job, {
        where: { id },
        lock: { mode: "pessimistic_write" },
      });

      if (!job) throw new NotFoundException(`Job ${id} not found`);

      const allowed = VALID_TRANSITIONS[job.status];
      if (!allowed.includes(dto.status)) {
        throw new UnprocessableEntityException(
          `Cannot transition from '${job.status}' to '${dto.status}'. ` +
            `Allowed transitions: ${allowed.length ? allowed.join(", ") : "none (terminal state)"}`,
        );
      }

      job.status = dto.status;
      return manager.save(job);
    });
  }

  async remove(id: string): Promise<void> {
    const job = await this.findOne(id);
    await this.jobsRepo.remove(job);
  }

  /** Returns count per status for the summary bar */
  async getStatusCounts(): Promise<Record<JobStatus, number>> {
    const counts = await this.jobsRepo
      .createQueryBuilder("job")
      .select("job.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("job.status")
      .getRawMany();

    const result: Record<string, number> = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
    };
    for (const row of counts) {
      result[row.status] = Number(row.count);
    }
    return result as Record<JobStatus, number>;
  }
}
