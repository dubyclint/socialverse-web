// ============================================================================
// FILE: /utils/error-catcher.ts - COMPREHENSIVE ERROR LOGGING SYSTEM
// ============================================================================
// Captures and logs all errors at every point in the signup flow
// ============================================================================

import type { FetchError } from 'ofetch'

// ============================================================================
// ERROR TYPES & INTERFACES
// ============================================================================

export interface SignupErrorLog {
  timestamp: string
  phase: string
  errorType: string
  errorCode?: string
  errorMessage: string
  statusCode?: number
  requestData?: any
  responseData?: any
  stackTrace?: string
  userAgent?: string
  url?: string
  additionalContext?: Record<string, any>
}

export interface ErrorCatcherConfig {
  enableConsoleLogging: boolean
  enableLocalStorage: boolean
  enableRemoteLogging: boolean
  remoteEndpoint?: string
  maxStoredErrors: number
}

// ============================================================================
// ERROR CATCHER CLASS
// ============================================================================

export class SignupErrorCatcher {
  private config: ErrorCatcherConfig
  private errorLogs: SignupErrorLog[] = []
  private readonly STORAGE_KEY = 'signup_error_logs'

  constructor(config: Partial<ErrorCatcherConfig> = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableLocalStorage: true,
      enableRemoteLogging: false,
      maxStoredErrors: 50,
      ...config
    }

    this.loadErrorsFromStorage()
  }

  // ============================================================================
  // MAIN ERROR CAPTURE METHOD
  // ============================================================================

  /**
   * Capture and log an error with full context
   */
  public captureError(
    phase: string,
    error: any,
    context?: Record<string, any>
  ): SignupErrorLog {
    const errorLog = this.buildErrorLog(phase, error, context)

    // Store error
    this.errorLogs.push(errorLog)

    // Log to console
    if (this.config.enableConsoleLogging) {
      this.logToConsole(errorLog)
    }

    // Store in localStorage
    if (this.config.enableLocalStorage) {
      this.saveErrorsToStorage()
    }

    // Send to remote server
    if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
      this.sendToRemote(errorLog)
    }

    return errorLog
  }

  // ============================================================================
  // ERROR LOG BUILDER
  // ============================================================================

  private buildErrorLog(
    phase: string,
    error: any,
    context?: Record<string, any>
  ): SignupErrorLog {
    const errorLog: SignupErrorLog = {
      timestamp: new Date().toISOString(),
      phase,
      errorType: this.getErrorType(error),
      errorCode: this.getErrorCode(error),
      errorMessage: this.getErrorMessage(error),
      statusCode: this.getStatusCode(error),
      stackTrace: this.getStackTrace(error),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      additionalContext: context
    }

    return errorLog
  }

  // ============================================================================
  // ERROR EXTRACTION HELPERS
  // ============================================================================

  private getErrorType(error: any): string {
    if (error instanceof TypeError) return 'TypeError'
    if (error instanceof ReferenceError) return 'ReferenceError'
    if (error instanceof SyntaxError) return 'SyntaxError'
    if (error instanceof RangeError) return 'RangeError'
    if (error?.name) return error.name
    if (error?.constructor?.name) return error.constructor.name
    return 'UnknownError'
  }

  private getErrorCode(error: any): string | undefined {
    return (
      error?.code ||
      error?.statusCode ||
      error?.status ||
      error?.data?.code ||
      error?.data?.statusCode ||
      undefined
    )
  }

  private getErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    if (error?.data?.message) return error.data.message
    if (error?.data?.statusMessage) return error.data.statusMessage
    if (error?.statusMessage) return error.statusMessage
    return 'Unknown error occurred'
  }

  private getStatusCode(error: any): number | undefined {
    return (
      error?.statusCode ||
      error?.status ||
      error?.response?.status ||
      error?.data?.statusCode ||
      undefined
    )
  }

  private getStackTrace(error: any): string | undefined {
    return error?.stack || undefined
  }

  // ============================================================================
  // CONSOLE LOGGING
  // ============================================================================

  private logToConsole(errorLog: SignupErrorLog): void {
    const style = {
      error: 'color: #dc2626; font-weight: bold; font-size: 14px;',
      phase: 'color: #667eea; font-weight: bold;',
      message: 'color: #374151; font-size: 13px;',
      code: 'color: #ea580c; font-family: monospace;',
      context: 'color: #6b7280; font-size: 12px;'
    }

    console.group(
      `%c❌ SIGNUP ERROR - ${errorLog.phase}`,
      style.error
    )

    console.log(`%cPhase:`, style.phase, errorLog.phase)
    console.log(`%cType:`, style.phase, errorLog.errorType)
    console.log(`%cMessage:`, style.phase, errorLog.errorMessage)

    if (errorLog.errorCode) {
      console.log(`%cCode:`, style.code, errorLog.errorCode)
    }

    if (errorLog.statusCode) {
      console.log(`%cStatus Code:`, style.code, errorLog.statusCode)
    }

    if (errorLog.additionalContext) {
      console.log(`%cContext:`, style.phase, errorLog.additionalContext)
    }

    if (errorLog.stackTrace) {
      console.log(`%cStack Trace:`, style.phase)
      console.log(errorLog.stackTrace)
    }

    console.log(`%cTimestamp:`, style.context, errorLog.timestamp)
    console.log(`%cFull Log:`, style.context, errorLog)

    console.groupEnd()
  }

  // ============================================================================
  // LOCAL STORAGE MANAGEMENT
  // ============================================================================

  private saveErrorsToStorage(): void {
    if (!process.client) return

    try {
      // Keep only the most recent errors
      const recentErrors = this.errorLogs.slice(-this.config.maxStoredErrors)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentErrors))
    } catch (err) {
      console.error('[ErrorCatcher] Failed to save errors to localStorage:', err)
    }
  }

  private loadErrorsFromStorage(): void {
    if (!process.client) return

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.errorLogs = JSON.parse(stored)
      }
    } catch (err) {
      console.error('[ErrorCatcher] Failed to load errors from localStorage:', err)
    }
  }

  // ============================================================================
  // REMOTE LOGGING
  // ============================================================================

  private async sendToRemote(errorLog: SignupErrorLog): Promise<void> {
    if (!this.config.remoteEndpoint) return

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog)
      })
    } catch (err) {
      console.error('[ErrorCatcher] Failed to send error to remote:', err)
    }
  }

  // ============================================================================
  // ERROR RETRIEVAL & ANALYSIS
  // ============================================================================

  /**
   * Get all captured errors
   */
  public getAllErrors(): SignupErrorLog[] {
    return [...this.errorLogs]
  }

  /**
   * Get errors by phase
   */
  public getErrorsByPhase(phase: string): SignupErrorLog[] {
    return this.errorLogs.filter(log => log.phase === phase)
  }

  /**
   * Get errors by type
   */
  public getErrorsByType(errorType: string): SignupErrorLog[] {
    return this.errorLogs.filter(log => log.errorType === errorType)
  }

  /**
   * Get the most recent error
   */
  public getLatestError(): SignupErrorLog | undefined {
    return this.errorLogs[this.errorLogs.length - 1]
  }

  /**
   * Get error summary
   */
  public getErrorSummary(): {
    totalErrors: number
    errorsByPhase: Record<string, number>
    errorsByType: Record<string, number>
    mostCommonError: string | null
  } {
    const errorsByPhase: Record<string, number> = {}
    const errorsByType: Record<string, number> = {}

    this.errorLogs.forEach(log => {
      errorsByPhase[log.phase] = (errorsByPhase[log.phase] || 0) + 1
      errorsByType[log.errorType] = (errorsByType[log.errorType] || 0) + 1
    })

    const mostCommonError = Object.entries(errorsByType).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] || null

    return {
      totalErrors: this.errorLogs.length,
      errorsByPhase,
      errorsByType,
      mostCommonError
    }
  }

  /**
   * Export errors as JSON
   */
  public exportAsJSON(): string {
    return JSON.stringify(this.errorLogs, null, 2)
  }

  /**
   * Export errors as CSV
   */
  public exportAsCSV(): string {
    if (this.errorLogs.length === 0) return ''

    const headers = [
      'Timestamp',
      'Phase',
      'Error Type',
      'Error Code',
      'Error Message',
      'Status Code',
      'URL'
    ]

    const rows = this.errorLogs.map(log => [
      log.timestamp,
      log.phase,
      log.errorType,
      log.errorCode || '',
      log.errorMessage,
      log.statusCode || '',
      log.url || ''
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return csv
  }

  /**
   * Clear all errors
   */
  public clearErrors(): void {
    this.errorLogs = []
    if (process.client) {
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }

  /**
   * Print error report to console
   */
  public printReport(): void {
    const summary = this.getErrorSummary()

    console.group('%c📊 SIGNUP ERROR REPORT', 'color: #667eea; font-weight: bold; font-size: 16px;')

    console.log('Total Errors:', summary.totalErrors)
    console.log('Errors by Phase:', summary.errorsByPhase)
    console.log('Errors by Type:', summary.errorsByType)
    console.log('Most Common Error:', summary.mostCommonError)

    console.log('\nAll Errors:')
    this.errorLogs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.phase}] ${log.errorType}: ${log.errorMessage}`)
    })

    console.groupEnd()
  }
}

// ============================================================================
// COMPOSABLE: useSignupErrorCatcher
// ============================================================================

export const useSignupErrorCatcher = () => {
  const errorCatcher = new SignupErrorCatcher({
    enableConsoleLogging: true,
    enableLocalStorage: true,
    enableRemoteLogging: false,
    maxStoredErrors: 50
  })

  return {
    captureError: (phase: string, error: any, context?: Record<string, any>) =>
      errorCatcher.captureError(phase, error, context),
    getAllErrors: () => errorCatcher.getAllErrors(),
    getErrorsByPhase: (phase: string) => errorCatcher.getErrorsByPhase(phase),
    getErrorsByType: (type: string) => errorCatcher.getErrorsByType(type),
    getLatestError: () => errorCatcher.getLatestError(),
    getErrorSummary: () => errorCatcher.getErrorSummary(),
    exportAsJSON: () => errorCatcher.exportAsJSON(),
    exportAsCSV: () => errorCatcher.exportAsCSV(),
    clearErrors: () => errorCatcher.clearErrors(),
    printReport: () => errorCatcher.printReport()
  }
}
