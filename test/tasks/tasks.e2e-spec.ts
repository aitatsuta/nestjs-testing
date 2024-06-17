import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { setTimeout } from 'timers/promises';
import { TasksModule } from '../../src/tasks/tasks.module';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../src/tasks/task.entity';

describe('Tasks - /tasks (e2e)', () => {
    const taskA = {
        name: 'work out',
    };

    const taskB = {
        name: 'read books',
    };

    const taskC = {
        name: 'take a walk',
    };

    const updateTask = {
        name: 'exercise',
        isCompleted: true,
    };

    const deleteResult = {
        raw: [],
        affected: 1,
    };

    const taskWithNameEmpty = {
        name: '',
    };

    const taskWithInvalidName = {
        name: 123,
    };

    const taskWithIsCompletedEmpty = {
        name: 'work out',
        isCompleted: null,
    };

    const taskWithInvalidIsCompleted = {
        name: 'work out',
        isCompleted: 'true',
    }

    let app: INestApplication;
    let tasksRepository: Repository<Task>;

    let postgreSqlContainer: StartedPostgreSqlContainer;
    jest.setTimeout(30000);

    beforeAll(async () => {
        postgreSqlContainer = await new PostgreSqlContainer('postgres').start();

        await setTimeout(3000);
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: postgreSqlContainer.getHost(),
                    port: postgreSqlContainer.getPort(),
                    username: postgreSqlContainer.getUsername(),
                    password: postgreSqlContainer.getPassword(),
                    database: postgreSqlContainer.getDatabase(),
                    autoLoadEntities: true,
                    synchronize: true
                }),
                TasksModule
            ],
        }).compile();

        app = module.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        tasksRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    });

    it('Create a task [POST /tasks]', () => {
        return request(app.getHttpServer())
            .post('/tasks')
            .send(taskA)
            .expect(201)
            .then(({ body }) => {
                expect(body).toEqual({
                    id: expect.any(Number),
                    ...taskA,
                    isCompleted: false,
                });
            });
    });

    it('Get all tasks [GET /tasks]', async () => {
        const taskArray = await tasksRepository.save([taskA, taskB, taskC]);
        return request(app.getHttpServer())
            .get('/tasks')
            .expect(200)
            .then(({ body }) => {
                expect(body).toEqual(taskArray);
            });
    });

    it('Get a task [GET /tasks/:id]', async () => {
        const createdTask = await tasksRepository.save(taskA);
        return request(app.getHttpServer())
            .get(`/tasks/${createdTask.id}`)
            .expect(200)
            .then(({ body }) => {
                expect(body).toEqual(createdTask);
            });
    });

    it('Update a task [PATCH /tasks/:id]', async () => {
        const task = await tasksRepository.save(taskA);
        return request(app.getHttpServer())
            .patch(`/tasks/${task.id}`)
            .send(updateTask)
            .expect(200)
            .then(({ body }) => {
                expect(body).toEqual({
                    id: task.id,
                    ...updateTask,
                });
            });
    });

    it('Delete a task [DELETE /tasks/:id]', async () => {
        const task = await tasksRepository.save(taskA);
        return request(app.getHttpServer())
            .delete(`/tasks/${task.id}`)
            .expect(200)
            .then(({ body }) => {
                expect(body).toEqual(deleteResult);
            });
    });

    it('Should not create a task with empty name [POST /tasks]', () => {
        return request(app.getHttpServer())
            .post('/tasks')
            .send(taskWithNameEmpty)
            .expect(400)
            .then(({ body }) => {
                expect(body).toEqual({
                    statusCode: 400,
                    message: ['name should not be empty'],
                    error: 'Bad Request',
                });
            });
    });

    it('Should not create a task with invalid name [POST /tasks]', () => {
        return request(app.getHttpServer())
            .post('/tasks')
            .send(taskWithInvalidName)
            .expect(400)
            .then(({ body }) => {
                expect(body).toEqual({
                    statusCode: 400,
                    message: ['name must be a string'],
                    error: 'Bad Request',
                });
            });
    });

    // it('Should not update a task with empty isCompleted [PATCH /tasks/:id]', async () => {
    //     const task = await tasksRepository.save(taskA);
    //     return request(app.getHttpServer())
    //         .patch(`/tasks/${task.id}`)
    //         .send(taskWithIsCompletedEmpty)
    //         .expect(400)
    //         .then(({ body }) => {
    //             expect(body).toEqual({
    //                 statusCode: 400,
    //                 message: [
    //                     'isComplated must be a boolean value',
    //                     'isComplated should not be empty',
    //                 ],
    //                 error: 'Bad Request',
    //             });
    //         });
    // });

    // it('Should not update a task with string isCompleted [PATCH /tasks/:id]', async () => {
    //     const task = await tasksRepository.save(taskA);
    //     return request(app.getHttpServer())
    //         .patch(`/tasks/${task.id}`)
    //         .send(taskWithInvalidIsCompleted)
    //         .expect(400)
    //         .then(({ body }) => {
    //             expect(body).toEqual({
    //                 statusCode: 400,
    //                 message: [
    //                     'isComplated must be a boolean value'
    //                 ],
    //                 error: 'Bad Request',
    //             });
    //         });
    // });

    afterEach(async () => {
        await tasksRepository.query(`DELETE FROM task;`);
    })

    afterAll(async () => {
        postgreSqlContainer.stop();
        await app.close();
    });

});