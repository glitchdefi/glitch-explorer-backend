import * as path from 'path';

import { createConnection } from 'typeorm';

export const DatabaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async () =>
      await createConnection({
        type: 'postgres',

        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT),
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,

        entities: [path.resolve(__dirname, '../..', 'databases', '**/*.entity{.ts,.js}')],
        synchronize: true,
        // logging: true,
      }),
  },
];
