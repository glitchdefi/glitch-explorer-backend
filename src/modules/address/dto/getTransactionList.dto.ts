import {
  IsDateString,
  IsEnum,
  IsNumberString,
  IsOptional,
} from 'class-validator';

export enum TransactionType {
  SEND = '0',
  RECEIVE = '1',
}

export enum TransactionStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

export class GetTransactionListDto {
  @IsNumberString(1)
  @IsOptional()
  readonly page_size: number;

  @IsNumberString()
  @IsOptional()
  readonly page_index: number;

  @IsDateString()
  @IsOptional()
  readonly start_date: Date;

  @IsDateString()
  @IsOptional()
  readonly end_date: Date;

  @IsEnum(TransactionType)
  @IsOptional()
  readonly type: TransactionType;

  @IsEnum(TransactionStatus)
  @IsOptional()
  readonly status: TransactionStatus;
}
