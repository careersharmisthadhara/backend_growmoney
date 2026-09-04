import { handler } from './handlers/calculate';
import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

// Fake API Gateway event for POST /calculate
const calculateEvent: any = {
  requestContext: {
    requestId: 'local-test-123',
    http: {
      method:    'POST',
      path:      '/calculate',
      sourceIp:  '127.0.0.1',
      userAgent: 'local-test',
    }
  },
  body: JSON.stringify({
    monthly: 5000,
    rate:    12,
    years:   10,
    name:    'Sharmistha',
    email:   'test@gmail.com'
  }),
  headers: {
    'Content-Type': 'application/json'
  }
};

const statsEvent: any = {
  requestContext: {
    requestId: 'local-test-456',
    http: {
      method:    'GET',
      path:      '/stats',
      sourceIp:  '127.0.0.1',
      userAgent: 'local-test',
    }
  },
  body: null,
  headers: {}
};

const invalidEvent: any = {
  requestContext: {
    requestId: 'local-test-789',
    http: {
      method:    'POST',
      path:      '/calculate',
      sourceIp:  '127.0.0.1',
      userAgent: 'local-test',
    }
  },
  body: JSON.stringify({
    monthly: 100,
    rate:    50,
  }),
  headers: {}
};

async function runTests() {

  console.log('\n================================================');
  console.log('TEST 1 — POST /calculate (valid input)');
  console.log('================================================');
  try {
    const result = await handler(calculateEvent) as APIGatewayProxyStructuredResultV2;
    console.log('Status:', result.statusCode);
    console.log('Response:', JSON.stringify(
      JSON.parse(result.body as string),
      null, 2
    ));
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n================================================');
  console.log('TEST 2 — POST /calculate (invalid input)');
  console.log('================================================');
  try {
    const result = await handler(invalidEvent) as APIGatewayProxyStructuredResultV2;
    console.log('Status:', result.statusCode);
    console.log('Response:', JSON.stringify(
      JSON.parse(result.body as string),
      null, 2
    ));
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n================================================');
  console.log('TEST 3 — GET /stats');
  console.log('================================================');
  try {
    const result = await handler(statsEvent) as APIGatewayProxyStructuredResultV2;
    console.log('Status:', result.statusCode);
    console.log('Response:', JSON.stringify(
      JSON.parse(result.body as string),
      null, 2
    ));
  } catch (error) {
    console.error('Error:', error);
  }
}

runTests();