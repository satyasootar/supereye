import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getEffectiveTokenLimit,
  getRemainingTokenAllowance,
  getWalletDisplayMetrics,
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

  it('getWalletDisplayMetrics derives used percent from remaining allowance', () => {
    const metrics = getWalletDisplayMetrics({
      monthlyAllocation: 600,
      bonusAllocation: 0,
      usedThisPeriod: 0,
      balance: 400,
    });
    assert.equal(metrics.remaining, 400);
    assert.equal(metrics.used, 200);
    assert.equal(metrics.pct, 33);
  });

  it('getWalletDisplayMetrics tracks usedThisPeriod consumption', () => {
    const metrics = getWalletDisplayMetrics({
      monthlyAllocation: 600,
      bonusAllocation: 0,
      usedThisPeriod: 150,
      balance: 450,
    });
    assert.equal(metrics.remaining, 450);
    assert.equal(metrics.used, 150);
    assert.equal(metrics.pct, 25);
  });

  it('getWalletDisplayMetrics never reports 100% used while credits remain', () => {
    for (const monthlyAllocation of [80, 100, 160, 1000]) {
      for (let usedThisPeriod = 0; usedThisPeriod <= monthlyAllocation; usedThisPeriod += 10) {
        for (let balance = 0; balance <= monthlyAllocation; balance += 10) {
          const metrics = getWalletDisplayMetrics({
            monthlyAllocation,
            bonusAllocation: 0,
            usedThisPeriod,
            balance,
          });
          if (metrics.remaining > 0) {
            assert.ok(metrics.pct < 100, JSON.stringify({ monthlyAllocation, usedThisPeriod, balance, metrics }));
          }
        }
      }
    }
  });
});
