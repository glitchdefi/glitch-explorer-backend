import { Log } from '../../databases';
import { Connection } from 'typeorm';

export const LogProviders = [
  {
    provide: 'LOG_REPOSITORY',
    useFactory: (connection: Connection) => connection.getRepository(Log),
    inject: ['DATABASE_CONNECTION'],
  },
];
