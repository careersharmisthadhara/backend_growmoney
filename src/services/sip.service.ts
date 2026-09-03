// ─────────────────────────────────────────────────────
// SIP SERVICE
// OOP concept: Single Responsibility
// This class ONLY does SIP calculations
// Nothing else — no DB, no HTTP, no logging
// ─────────────────────────────────────────────────────

import {
  ICalculationInput,
  ICalculationResult,
  IYearlyData,
} from '../models/calculation.model';

export class SIPService {

  // ── MAIN CALCULATION ─────────────────────────────
  // Formula: M = P × {[(1 + r)^n – 1] / r} × (1 + r)
  // P = monthly amount
  // r = monthly rate (annual / 12 / 100)
  // n = total months (years × 12)
  calculate(input: ICalculationInput): ICalculationResult {
    const { monthly, rate, years } = input;

    // Validate inputs before calculating
    this.validateInputs(monthly, rate, years);

    const maturity  = this.calculateMaturity(monthly, rate, years);
    const invested  = Math.round(monthly * years * 12);
    const returns   = Math.round(maturity - invested);
    const yearlyData = this.generateYearlyData(monthly, rate, years);

    return {
      invested,
      returns,
      maturity: Math.round(maturity),
      yearlyData,
    };
  }

  // ── PRIVATE METHODS ───────────────────────────────
  // Encapsulation — these are internal implementation details
  // Outside world cannot call them directly

  private calculateMaturity(
    monthly: number,
    rate: number,
    years: number
  ): number {
    const r = rate / 12 / 100;   // monthly rate
    const n = years * 12;         // total months

    // Handle edge case — zero rate
    if (r === 0) return monthly * n;

    return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  }

  private generateYearlyData(
    monthly: number,
    rate: number,
    years: number
  ): IYearlyData[] {
    const data: IYearlyData[] = [];

    for (let year = 1; year <= years; year++) {
      const maturity = Math.round(this.calculateMaturity(monthly, rate, year));
      const invested = Math.round(monthly * year * 12);
      const returns  = maturity - invested;

      data.push({ year, invested, maturity, returns });
    }

    return data;
  }

  private validateInputs(
    monthly: number,
    rate: number,
    years: number
  ): void {
    if (monthly < 500 || monthly > 10000000) {
      throw new Error('Monthly amount must be between ₹500 and ₹1,00,00,000');
    }
    if (rate < 1 || rate > 30) {
      throw new Error('Return rate must be between 1% and 30%');
    }
    if (years < 1 || years > 40) {
      throw new Error('Duration must be between 1 and 40 years');
    }
  }
}