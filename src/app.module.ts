import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstructorModule } from './instructor/instructor.module';
import { LectureModule } from './lecture/lecture.module';
import { StudentModule } from './student/student.module';
import { AuthModule } from './auth/auth.module';
import { Instructor } from './instructor/entities/instructor.entity';
import { Lecture } from './lecture/entities/lecture.entitiy';
import { Student } from './student/entities/student.entity';
import { EventsModule } from './events/events.module';

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
        entities: [Instructor, Lecture, Student],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    EventsModule,
    InstructorModule,
    LectureModule,
    StudentModule,
    AuthModule,
  ],
})
export class AppModule {}
