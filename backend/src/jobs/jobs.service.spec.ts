import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { JobsService } from "./jobs.service";
import { Job, JobStatus, JobType } from "./job.entity";
import { UnprocessableEntityException, NotFoundException } from "@nestjs/common";

const mockJob = (status: JobStatus): Job => ({
  id: "test-uuid",
  title: "Test Job",
  type: JobType.EMAIL,
  status,
  createdAt: new Date(),
  version: 1,
});

describe("JobsService - State Transitions", () => {
  let service: JobsService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: getRepositoryToken(Job), useValue: mockRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    jest.clearAllMocks();
  });

  describe("updateStatus", () => {
    it("should allow pending -> running", async () => {
      const job = mockJob(JobStatus.PENDING);
      mockDataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(job),
          save: jest.fn().mockImplementation((j) => Promise.resolve(j)),
        };
        return cb(manager);
      });

      const result = await service.updateStatus("test-uuid", { status: JobStatus.RUNNING });
      expect(result.status).toBe(JobStatus.RUNNING);
    });

    it("should allow running -> completed", async () => {
      const job = mockJob(JobStatus.RUNNING);
      mockDataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(job),
          save: jest.fn().mockImplementation((j) => Promise.resolve(j)),
        };
        return cb(manager);
      });

      const result = await service.updateStatus("test-uuid", { status: JobStatus.COMPLETED });
      expect(result.status).toBe(JobStatus.COMPLETED);
    });

    it("should allow running -> failed", async () => {
      const job = mockJob(JobStatus.RUNNING);
      mockDataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(job),
          save: jest.fn().mockImplementation((j) => Promise.resolve(j)),
        };
        return cb(manager);
      });

      const result = await service.updateStatus("test-uuid", { status: JobStatus.FAILED });
      expect(result.status).toBe(JobStatus.FAILED);
    });

    it("should reject pending -> completed (invalid transition)", async () => {
      const job = mockJob(JobStatus.PENDING);
      mockDataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(job),
          save: jest.fn(),
        };
        return cb(manager);
      });

      await expect(
        service.updateStatus("test-uuid", { status: JobStatus.COMPLETED }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it("should reject completed -> running (terminal state)", async () => {
      const job = mockJob(JobStatus.COMPLETED);
      mockDataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(job),
          save: jest.fn(),
        };
        return cb(manager);
      });

      await expect(
        service.updateStatus("test-uuid", { status: JobStatus.RUNNING }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it("should reject failed -> running (terminal state)", async () => {
      const job = mockJob(JobStatus.FAILED);
      mockDataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(job),
          save: jest.fn(),
        };
        return cb(manager);
      });

      await expect(
        service.updateStatus("test-uuid", { status: JobStatus.RUNNING }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it("should throw NotFoundException for unknown job", async () => {
      mockDataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn(),
        };
        return cb(manager);
      });

      await expect(
        service.updateStatus("bad-id", { status: JobStatus.RUNNING }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
