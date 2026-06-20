import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getEffectiveTokenLimit,
  getRemainingTokenAllowance,
} from '../wallet-math.ts';

describe('token limit enforcement helpers', () => {
  it('getEffectiveTokenLimit sums plan allocation and bonus', () => {
    assert.equal(
      getEffectiveTokenLimit({ monthlyAllocation: 1_000_000, bonusAllocation: 50_000 }),
      1_050_000
    );
  });

  it('getRemainingTokenAllowance respects usedThisPeriod cap', () => {
    const remaining = getRemainingTokenAllowance({
      monthlyAllocation: 1_000_000,
      bonusAllocation: 0,
      usedThisPeriod: 900_000,
      balance: 200_000,
    });
    assert.equal(remaining, 100_000);
  });

  it('getRemainingTokenAllowance is zero when exhausted', () => {
    const remaining = getRemainingTokenAllowance({
      monthlyAllocation: 1_000_000,
      bonusAllocation: 0,
      usedThisPeriod: 1_000_000,
      balance: 0,
    });
    assert.equal(remaining, 0);
  });

  it('bonus allocation extends usable allowance', () => {
    const remaining = getRemainingTokenAllowance({
      monthlyAllocation: 1_000_000,
      bonusAllocation: 100_000,
      usedThisPeriod: 1_000_000,
      balance: 100_000,
    });
    assert.equal(remaining, 100_000);
  });

  it('getRemainingTokenAllowance respects reduced balance after admin removal', () => {
    const remaining = getRemainingTokenAllowance({
      monthlyAllocation: 1_000_000,
      bonusAllocation: 0,
      usedThisPeriod: 0,
      balance: 200_000,
    });
    assert.equal(remaining, 200_000);
  });
});
