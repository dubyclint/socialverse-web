import { createError } from 'h3'

/** The platform's gateway budget: nothing downstream may exceed it. */
export const DEFAULT_TIMEOUT_MS = 5000

export async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: { timeoutMs?: number; label?: string } = {}
): Promise<T> {
  const timeoutMs = Math.min(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, DEFAULT_TIMEOUT_MS)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await operation(controller.signal)
  } catch (error) {
    if (controller.signal.aborted) {
      throw createError({
        statusCode: 504,
        statusMessage: `${options.label ?? 'Upstream'} timed out after ${timeoutMs}ms`
      })
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

type BreakerState = 'closed' | 'open' | 'half-open'

interface BreakerOptions {
  failureThreshold?: number
  cooldownMs?: number
  timeoutMs?: number
}

/**
 * Per-dependency circuit breaker. Instances are process-local; when a shared
 * store (Redis) is provisioned the counters move there without touching callers.
 */
export class CircuitBreaker {
  private failures = 0
  private openedAt = 0
  private state: BreakerState = 'closed'

  constructor(
    private readonly name: string,
    private readonly options: BreakerOptions = {}
  ) {}

  get status(): BreakerState {
    return this.state
  }

  async run<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const threshold = this.options.failureThreshold ?? 5
    const cooldown = this.options.cooldownMs ?? 30000

    if (this.state === 'open') {
      if (Date.now() - this.openedAt < cooldown) {
        throw createError({ statusCode: 503, statusMessage: `${this.name} is unavailable` })
      }
      this.state = 'half-open'
    }

    try {
      const result = await withTimeout(operation, { timeoutMs: this.options.timeoutMs, label: this.name })
      this.failures = 0
      this.state = 'closed'
      return result
    } catch (error) {
      this.failures += 1
      if (this.failures >= threshold) {
        this.state = 'open'
        this.openedAt = Date.now()
      }
      throw error
    }
  }
}
