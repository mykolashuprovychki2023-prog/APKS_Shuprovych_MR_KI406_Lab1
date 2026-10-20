import { describe, expect, it } from 'vitest';
import { greet } from '../src/greeting.ts';
import { add } from '../src/math.ts';

describe('HelloTest', () => {
  it('BasicAddition', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('HelloMessage', () => {
    expect(greet()).toBe('Hello, World!');
  });
});
