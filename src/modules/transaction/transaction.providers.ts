import { Connection } from 'typeorm';
import { Transaction } from '../../databases';

export const TransactionProviders = [
  {
    provide: 'TRANSACTION_REPOSITORY',
    useFactory: (connection: Connection) =>
      connection.getRepository(Transaction),
    inject: ['DATABASE_CONNECTION'],
  },
];
