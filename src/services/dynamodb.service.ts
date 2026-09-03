// ─────────────────────────────────────────────────────
// DYNAMODB SERVICE
// OOP concept: Encapsulation + Single Responsibility
// All DynamoDB logic hidden inside this class
// Handler never touches DynamoDB directly
// ─────────────────────────────────────────────────────

import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ICalculation }         from '../models/calculation.model';
import { Logger }               from './logger.service';

// Initialise OUTSIDE class — cached between Lambda invocations
// This is a performance optimisation — not creating new
// client on every request
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

export class DynamoDBService {
  private tableName: string;
  private logger:    Logger;

  // Constructor — dependency injection
  // Logger is INJECTED — not created inside
  // Makes testing easier — can inject mock logger
  constructor(logger: Logger) {
    this.tableName = process.env.TABLE_NAME || 'growmoney-calculations';
    this.logger    = logger;
  }

  // ── SAVE CALCULATION ─────────────────────────────
  async saveCalculation(calculation: ICalculation): Promise<void> {
    try {
      this.logger.info('Saving calculation to DynamoDB', {
        calculationId: calculation.calculationId,
      });

      await dynamoClient.send(new PutItemCommand({
        TableName: this.tableName,
        Item:      marshall(calculation, {
          removeUndefinedValues: true, // skip undefined optional fields
        }),
        // Prevent overwriting existing item
        ConditionExpression: 'attribute_not_exists(calculationId)',
      }));

      this.logger.info('Calculation saved successfully', {
        calculationId: calculation.calculationId,
      });

    } catch (error: unknown) {
      this.logger.error('Failed to save calculation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        calculationId: calculation.calculationId,
      });
      throw error;
    }
  }

  // ── GET TOTAL COUNT ───────────────────────────────
  async getTotalCount(): Promise<number> {
    try {
      const result = await dynamoClient.send(new ScanCommand({
        TableName: this.tableName,
        Select:    'COUNT', // only return count — not all items
      }));

      return result.Count || 0;

    } catch (error: unknown) {
      this.logger.error('Failed to get count', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0; // return 0 on error — non-critical
    }
  }
}