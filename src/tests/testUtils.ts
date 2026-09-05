export interface TestResult {
  suiteName: string;
  name: string;
  passed: boolean;
  error?: string;
}

export class TestRunner {
  private results: TestResult[] = [];
  private currentSuite: string = 'Default';

  public suite(name: string, fn?: () => void | Promise<void>): void {
    this.currentSuite = name;
    if (fn) {
      void fn();
    }
  }

  public async test(name: string, fn: () => void | Promise<void>): Promise<void> {
    try {
      await fn();
      this.results.push({
        suiteName: this.currentSuite,
        name,
        passed: true,
      });
      console.log(`  ✓ ${name}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      this.results.push({
        suiteName: this.currentSuite,
        name,
        passed: false,
        error: errorMsg,
      });
      console.error(`  ✗ ${name}`);
      console.error(`    -> ${errorMsg}`);
    }
  }

  public getSummary(): { total: number; passed: number; failed: number; results: TestResult[] } {
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    return {
      total: this.results.length,
      passed,
      failed,
      results: this.results,
    };
  }
}

export function assert(condition: boolean, message: string = 'Assertion failed'): void {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${JSON.stringify(expected)}, but received ${JSON.stringify(actual)}`
    );
  }
}

export async function assertThrows(fn: () => unknown | Promise<unknown>, expectedSubstring?: string): Promise<void> {
  let threw = false;
  let caughtError: unknown;
  try {
    await fn();
  } catch (err) {
    threw = true;
    caughtError = err;
  }

  if (!threw) {
    throw new Error('Expected function to throw, but it succeeded');
  }

  if (expectedSubstring && caughtError instanceof Error) {
    if (!caughtError.message.includes(expectedSubstring)) {
      throw new Error(
        `Expected error message to contain "${expectedSubstring}", but got "${caughtError.message}"`
      );
    }
  }
}
