/**
 * High-Precision Monetary Arithmetic & Financial Math Utilities
 * 
 * CRITICAL INVARIANT:
 * All monetary calculations use exact integer paise (1 INR = 100 paise) representation
 * to eliminate IEEE-754 floating-point inaccuracies and rounding drift.
 */

export class Money {
  readonly paise: number;

  constructor(paise: number) {
    if (!Number.isFinite(paise)) {
      throw new Error(`Invalid monetary amount: ${paise}`);
    }
    this.paise = Math.round(paise);
  }

  static fromInr(inr: number): Money {
    if (!Number.isFinite(inr)) {
      throw new Error(`Invalid INR amount: ${inr}`);
    }
    return new Money(Math.round(inr * 100));
  }

  static fromPaise(paise: number): Money {
    return new Money(paise);
  }

  static zero(): Money {
    return new Money(0);
  }

  get inr(): number {
    return this.paise / 100;
  }

  add(other: Money): Money {
    return new Money(this.paise + other.paise);
  }

  subtract(other: Money): Money {
    return new Money(this.paise - other.paise);
  }

  multiply(scalar: number): Money {
    return new Money(Math.round(this.paise * scalar));
  }

  /**
   * Multiplies by percentage (e.g., 5.5% -> percent=5.5)
   */
  percent(percentValue: number): Money {
    return new Money(Math.round((this.paise * percentValue) / 100));
  }

  /**
   * Multiplies by basis points (1 bps = 0.01% = 0.0001)
   */
  basisPoints(bps: number): Money {
    return new Money(Math.round((this.paise * bps) / 10000));
  }

  isZero(): boolean {
    return this.paise === 0;
  }

  isPositive(): boolean {
    return this.paise > 0;
  }

  isNegative(): boolean {
    return this.paise < 0;
  }

  equals(other: Money): boolean {
    return this.paise === other.paise;
  }

  greaterThan(other: Money): boolean {
    return this.paise > other.paise;
  }

  lessThan(other: Money): boolean {
    return this.paise < other.paise;
  }

  formatInr(): string {
    const absInr = Math.abs(this.inr);
    const formatted = absInr.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return this.paise < 0 ? `-₹${formatted}` : `₹${formatted}`;
  }
}

/**
 * Functional helpers for direct paise arithmetic without object allocations
 */
export function toPaise(inr: number): number {
  if (!Number.isFinite(inr)) throw new Error(`Invalid INR value: ${inr}`);
  return Math.round(inr * 100);
}

export function fromPaise(paise: number): number {
  if (!Number.isFinite(paise)) throw new Error(`Invalid paise value: ${paise}`);
  return Math.round(paise) / 100;
}

export function addPaise(...paiseValues: number[]): number {
  return paiseValues.reduce((sum, val) => sum + Math.round(val), 0);
}

export function subtractPaise(a: number, b: number): number {
  return Math.round(a) - Math.round(b);
}

export function calculatePercentagePaise(basePaise: number, percentRate: number): number {
  return Math.round((Math.round(basePaise) * percentRate) / 100);
}

export function formatInrFromPaise(paise: number): string {
  const inr = fromPaise(paise);
  const formatted = Math.abs(inr).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return paise < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

