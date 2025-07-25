import { fakerES as faker } from '@faker-js/faker';
import * as _ from 'lodash';
import * as bcrypt from 'bcrypt';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Fixtures1729684901439 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const usersToInsert = await Promise.all(
            _.range(1, 29).map(async () => {
                const firstName = faker.person.firstName();
                const lastName = faker.person.lastName();
                const password = faker.internet.password();
                const hashedPassword = await bcrypt.hash(password, 10);

                return {
                    fullname: faker.person.fullName({ firstName, lastName }),
                    email: faker.internet
                        .email({ firstName, lastName })
                        .toLowerCase(),
                    pass: hashedPassword,
                };
            }),
        );

        // I added this test user with a known password to help test the login functionality.
        // The user list generation was refactored to hash all passwords using bcrypt for security.
        const testUser = {
            fullname: 'Admin User',
            email: 'admin@example.com',
            pass: await bcrypt.hash('Test123!', 10),
        };

        usersToInsert.push(testUser);

        await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into('users')
            .values(usersToInsert)
            .execute();

        const ids = await queryRunner.manager.find('users', { select: ['id'] });

        const tasksToInsert = _.range(1, 1000).map(() => ({
            title: faker.lorem.words(),
            description: faker.lorem.sentence(),
            done: faker.datatype.boolean(),
            dueDate: faker.date.future().toISOString(),
            owner: ids[_.random(ids.length - 1, false)],
        }));

        await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into('tasks')
            .values(tasksToInsert)
            .execute();
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DELETE FROM tasks');
        await queryRunner.query('DELETE FROM users');
    }
}
