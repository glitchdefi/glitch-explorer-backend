import { Connection } from 'typeorm';
import { Transaction, Address, DailySummary } from '../../databases';

export const DashboardProviders = [
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
  {
    provide: 'DAILY_SUMMARY_REPOSITORY',
    useFactory: (connection: Connection) =>
      connection.getRepository(DailySummary),
    inject: ['DATABASE_CONNECTION'],
  },
];
