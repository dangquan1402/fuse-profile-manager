/**
 * Type shims for incomplete external dependencies
 */

// better-ccusage types (package has JS exports but incomplete TS subpath support)
declare module 'better-ccusage/data-loader' {
  export interface ModelBreakdown {
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
  }

  export interface DailyUsage {
    date: string;
    source: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
    totalCost: number;
    modelsUsed: string[];
    modelBreakdowns: ModelBreakdown[];
  }

  export interface MonthlyUsage {
    month: string;
    source: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    totalCost: number;
    modelsUsed: string[];
    modelBreakdowns: ModelBreakdown[];
  }

  export interface SessionUsage {
    sessionId: string;
    projectPath: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
    totalCost: number;
    lastActivity: string;
    versions: string[];
    modelsUsed: string[];
    modelBreakdowns: ModelBreakdown[];
    source: string;
  }

  export interface DataLoaderOptions {
    mode?: 'calculate' | 'cached';
    claudePaths?: string[];
  }

  export function loadDailyUsageData(options?: DataLoaderOptions): Promise<DailyUsage[]>;
  export function loadMonthlyUsageData(options?: DataLoaderOptions): Promise<MonthlyUsage[]>;
  export function loadSessionData(options?: DataLoaderOptions): Promise<SessionUsage[]>;
}

declare module 'better-ccusage/calculate-cost' {
  export interface Totals {
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    costUSD: number;
  }

  export function calculateTotals(entries: unknown[]): Totals;
  export function getTotalTokens(entries: unknown[]): number;
}

declare module 'cli-table3' {
  interface TableOptions {
    head?: string[];
    colWidths?: number[];
    colAligns?: ('left' | 'center' | 'right')[];
    style?: {
      head?: string[];
      border?: string[];
    };
    chars?: Record<string, string>;
  }

  class Table extends Array {
    constructor(options?: TableOptions);
    toString(): string;
  }

  export = Table;
}

// ora v9 has types but we want to ensure compatibility
declare module 'ora' {
  interface Options {
    text?: string;
    color?: 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white';
    spinner?: string | object;
    stream?: NodeJS.WritableStream;
  }

  interface Ora {
    start(text?: string): Ora;
    stop(): Ora;
    succeed(text?: string): Ora;
    fail(text?: string): Ora;
    warn(text?: string): Ora;
    info(text?: string): Ora;
    text: string;
    color: string;
  }

  function ora(options?: string | Options): Ora;
  export = ora;
}
