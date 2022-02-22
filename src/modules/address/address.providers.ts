import { Connection } from 'typeorm';
import { Address, BalanceHistory, Staking, Transaction } from '../../databases';

export const AddressProviders = [
  {
    provide: 'ADDRESS_REPOSITORY',
    useFactory: (connection: Connection) => connection.getRepository(Address),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'STAKING_REPOSITORY',
    useFactory: (connection: Connection) => connection.getRepository(Staking),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'TRANSACTION_REPOSITORY',
    useFactory: (connection: Connection) =>
      connection.getRepository(Transaction),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'BALANCE_HISTORY_REPOSITORY',
    useFactory: (connection: Connection) =>
      connection.getRepository(BalanceHistory),
    inject: ['DATABASE_CONNECTION'],
  },
];
