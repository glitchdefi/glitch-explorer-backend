import { Block } from '../../databases';
import { Connection } from 'typeorm';

export const BlockProviders = [
  {
    provide: 'BLOCK_REPOSITORY',
    useFactory: (connection: Connection) => connection.getRepository(Block),
    inject: ['DATABASE_CONNECTION'],
  },
];
