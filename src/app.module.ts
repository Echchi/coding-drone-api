import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstructorModule } from './instructor/instructor.module';
import { LectureModule } from './lectures/lecture.module';
import { StudentModule } from './student/student.module';
import { AuthModule } from './auth/auth.module';
import { Instructor } from './instructor/entities/instructor.entity';
import { Lecture } from './lectures/entities/lectures.entitiy';
import { Students } from './student/entities/student.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [Instructor, Lecture, Students],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    InstructorModule,
    LectureModule,
    StudentModule,
    AuthModule,
  ],
})
export class AppModule {}
