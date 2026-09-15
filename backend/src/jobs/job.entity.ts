import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  VersionColumn,
} from "typeorm";

export enum JobStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum JobType {
  EMAIL = "email",
  REPORT = "report",
  EXPORT = "export",
  IMPORT = "import",
  NOTIFICATION = "notification",
}

@Entity("jobs")
export class Job {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ length: 100 })
  title: string;

  @Column({
    type: "enum",
    enum: JobType,
  })
  type: JobType;

  @Column({
    type: "enum",
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  @CreateDateColumn()
  createdAt: Date;

  @VersionColumn()
  version: number;
}
