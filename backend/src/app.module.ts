import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JobsModule } from "./jobs/jobs.module";
import { Job } from "./jobs/job.entity";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "jobqueue",
      entities: [Job],
      synchronize: process.env.NODE_ENV !== "production",
      ssl: process.env.DATABASE_URL
        ? { rejectUnauthorized: false }
        : false,
      logging: process.env.NODE_ENV === "development",
    }),
    JobsModule,
  ],
})
export class AppModule {}
