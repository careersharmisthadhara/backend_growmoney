// ─────────────────────────────────────────────────────
// INTERFACES — define the shape of our data
// This is TypeScript OOP — interfaces as contracts
// ─────────────────────────────────────────────────────

// What comes IN from the frontend
export interface ICalculationInput {
  monthly:  number;
  rate:     number;
  years:    number;
  name?:    string;   // optional — ? means not required
  email?:   string;   // optional
}

// Year by year breakdown
export interface IYearlyData {
  year:     number;
  invested: number;
  maturity: number;
  returns:  number;
}

// The calculation result
export interface ICalculationResult {
  invested:   number;
  returns:    number;
  maturity:   number;
  yearlyData: IYearlyData[];
}

// What gets stored in DynamoDB
export interface ICalculation {
  calculationId: string;
  monthly:       number;
  rate:          number;
  years:         number;
  invested:      number;
  returns:       number;
  maturity:      number;
  name?:         string;
  email?:        string;
  ipAddress?:    string;
  userAgent?:    string;
  timestamp:     string;
  expiresAt:     number;  // TTL — auto delete after 1 year
}

// Generic API response wrapper — uses GENERICS
// T can be any type — reusable for any endpoint
export interface IApiResponse<T> {
  success:  boolean;
  data?:    T;
  error?:   string;
  message?: string;
}