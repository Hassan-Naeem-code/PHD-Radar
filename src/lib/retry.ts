interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error("Unreachable");
}

// Circuit breaker state
interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
  openedAt: number;
}

const circuits = new Map<string, CircuitState>();

const FAILURE_THRESHOLD = 5;
const RECOVERY_TIMEOUT = 300_000; // 5 minutes

export async function withCircuitBreaker<T>(
  service: string,
  fn: () => Promise<T>
): Promise<T> {
  let state = circuits.get(service);

  if (!state) {
    state = { failures: 0, lastFailure: 0, isOpen: false, openedAt: 0 };
    circuits.set(service, state);
  }

  // Check if circuit is open
  if (state.isOpen) {
    if (Date.now() - state.openedAt > RECOVERY_TIMEOUT) {
      // Half-open: allow one request through
      state.isOpen = false;
    } else {
      throw new Error(`Circuit breaker open for ${service}. Try again later.`);
    }
  }

  try {
    const result = await fn();
    // Success: reset failure count
    state.failures = 0;
    state.isOpen = false;
    return result;
  } catch (error) {
    state.failures++;
    state.lastFailure = Date.now();

    // Check if we should open the circuit
    if (state.failures >= FAILURE_THRESHOLD) {
      state.isOpen = true;
      state.openedAt = Date.now();
    }

    throw error;
  }
}

// Combined: retry with circuit breaker
export async function resilientFetch<T>(
  service: string,
  fn: () => Promise<T>,
  retryOptions?: RetryOptions
): Promise<T> {
  return withCircuitBreaker(service, () => fetchWithRetry(fn, retryOptions));
}
