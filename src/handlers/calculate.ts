// ─────────────────────────────────────────────────────
// LAMBDA HANDLER — entry point
// OOP concept: Dependency Injection
// Services are created here and injected
// Handler orchestrates — does not implement logic
// ─────────────────────────────────────────────────────

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { v4 as uuidv4 }          from 'uuid';
import { Logger }                from '../services/logger.service';
import { SIPService }            from '../services/sip.service';
import { DynamoDBService }       from '../services/dynamodb.service';
import { validateCalculationInput } from '../utils/validator';
import {
  ICalculationInput,
  ICalculation,
  IApiResponse,
  ICalculationResult,
} from '../models/calculation.model';

// ── INITIALISE OUTSIDE HANDLER ────────────────────
// Cached between Lambda invocations (warm starts)
// This is a performance best practice
const logger    = new Logger('CalculateHandler');
const sipService = new SIPService();
const dbService  = new DynamoDBService(logger);

// ── CORS HEADERS ──────────────────────────────────
// Required for browser to accept response
const corsHeaders = {
  'Content-Type':                'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type,Authorization',
};

// ── MAIN HANDLER ──────────────────────────────────
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {

  const requestId = event.requestContext.requestId;
  const method    = event.requestContext.http.method;
  const path      = event.requestContext.http.path;

  logger.info('Request received', { requestId, method, path });

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {

    // ── POST /calculate ──────────────────────────
    if (method === 'POST' && path === '/calculate') {
      return await handleCalculate(event);
    }

    // ── GET /stats ───────────────────────────────
    if (method === 'GET' && path === '/stats') {
      return await handleStats();
    }

    // ── 404 ──────────────────────────────────────
    return response(404, {
      success: false,
      error: 'Route not found',
    });

  } catch (error: unknown) {
    logger.error('Unhandled error in handler', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId,
    });

    return response(500, {
      success: false,
      error: 'Internal server error',
    });
  }
};

// ── CALCULATE HANDLER ─────────────────────────────
async function handleCalculate(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {

  // Parse body
  let body: unknown;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return response(400, {
      success: false,
      error: 'Invalid JSON in request body',
    });
  }

  // Validate input
  const validation = validateCalculationInput(body);
  if (!validation.isValid) {
    return response(400, {
      success: false,
      error: 'Validation failed',
      data: validation.errors,
    });
  }

  const input = body as ICalculationInput;

  // Calculate SIP
  const result: ICalculationResult = sipService.calculate(input);

  // Build calculation record for DynamoDB
  const calculationId = `CALC-${uuidv4()}`;
  const now           = new Date();
  const oneYearLater  = Math.floor(now.getTime() / 1000) + (365 * 24 * 60 * 60);

  const calculation: ICalculation = {
    calculationId,
    monthly:   input.monthly,
    rate:      input.rate,
    years:     input.years,
    invested:  result.invested,
    returns:   result.returns,
    maturity:  result.maturity,
    name:      input.name,
    email:     input.email,
    ipAddress: event.requestContext.http.sourceIp,
    userAgent: event.requestContext.http.userAgent,
    timestamp: now.toISOString(),
    expiresAt: oneYearLater, // TTL — auto delete after 1 year
  };

  // Save to DynamoDB (non-blocking to result)
  // We don't await here so response is faster
  // If DB save fails — user still gets their result
  dbService.saveCalculation(calculation).catch((error) => {
    logger.error('Background DB save failed', {
      calculationId,
      error: error instanceof Error ? error.message : 'Unknown',
    });
  });

  logger.info('Calculation completed', {
    calculationId,
    maturity: result.maturity,
  });

  // Return result to user
  return response(200, {
    success: true,
    data: {
      calculationId,
      ...result,
    },
  });
}

// ── STATS HANDLER ─────────────────────────────────
async function handleStats(): Promise<APIGatewayProxyResultV2> {
  const count = await dbService.getTotalCount();

  return response(200, {
    success: true,
    data: {
      totalCalculations: count,
      message: `${count.toLocaleString('en-IN')}+ calculations done`,
    },
  });
}

// ── RESPONSE HELPER ───────────────────────────────
function response(
  statusCode: number,
  body: IApiResponse<unknown>
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: corsHeaders,
    body:    JSON.stringify(body),
  };
}