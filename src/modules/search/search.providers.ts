import { Connection } from 'typeorm';
import { Block, Transaction, Address } from '../../databases';

export const SearchProviders = [
  {
    provide: 'BLOCK_REPOSITORY',
    useFactory: (connection: Connection) => connection.getRepository(Block),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'TRANSACTION_REPOSITORY',
    useFactory: (connection: Connection) =>
      connection.getRepository(Transaction),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'ADDRESS_REPOSITORY',
    useFactory: (connection: Connection) => connection.getRepository(Address),
    inject: ['DATABASE_CONNECTION'],
  },
];
