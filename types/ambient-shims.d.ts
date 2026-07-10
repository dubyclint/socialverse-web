// Permissive ambient shims used during incremental TS remediation.
// These intentionally use `any` to reduce noise quickly. Replace with
// strict types in subsequent passes.

declare const db: any;
declare const supabase: any;

declare module '#supabase/server' {
  export function serverSupabaseClient(...args: any[]): any;
  export function createServerSupabaseClient(...args: any[]): any;
}

declare function defineEventHandler<T = any>(handler: (event?: any) => T): any;
declare function createError(payload: any): any;
declare function sendError(event: any, err: any): any;
declare function readMultipartFormData(event: any): Promise<any>;

// h3 / Nitro helper shims often auto-imported by Nuxt. Add permissive
// declarations so server route files compile during remediation.
declare function getQuery<T = any>(event?: any): T;
declare function readBody<T = any>(event?: any): Promise<T>;
declare function getHeader(event: any, name: string): string | undefined;
declare function setHeader(event: any, name: string, value: string): void;
declare function getRouterParam(event: any, name: string): string | undefined;
declare function getRequestURL(event: any): string;

declare module 'aws-sdk';
declare module 'axios';
declare module '@tensorflow/tfjs-node';

// Shims for internal server utility modules that are used widely.
declare module '~/server/utils/database' {
  export const db: any;
  export const supabase: any;
  export function getSupabaseClient(...args: any[]): any;
  export function getSupabaseAdminClient(...args: any[]): any;
}

// Nitro plugin helper used in server plugins
declare function defineNitroPlugin<T = any>(fn: (nitroApp: any) => T): T;

declare module './auth-utils' {
  export const supabase: any;
  export const serverSupabaseClient: any;
}

declare module '~/server/gateway/auth/auth-utils' {
  export const supabase: any;
  export const serverSupabaseClient: any;
}

declare namespace NodeJS {
  interface Process {
    // Nuxt attaches `process.dev` at runtime. Make it optional here.
    dev?: boolean;
  }
}

// Minimal domain type placeholders used by several stores/files.
type VerificationStatus = 'none' | 'pending' | 'verified' | 'approved' | 'rejected';
type BadgeRequest = { id?: string; status?: VerificationStatus; [k: string]: any };
type UniverseMessage = { id: string; text?: string; userId?: string; [k: string]: any };

declare module '~/types/roles' {
  export type Role = any;
  export type Permission = any;
}

// Temporary permissive wildcard for server models to reduce cascading
// diagnostics during the incremental TypeScript remediation. Replace with
// concrete model type declarations in a follow-up pass.
declare module '~/server/models/*' {
  const anyModule: any;
  export = anyModule;
}
// Permissive ambient shims used during incremental TS remediation.
// These intentionally use `any` to reduce noise quickly. Replace with
// strict types in subsequent passes.

declare const db: any;
declare const supabase: any;

declare module '#supabase/server' {
  export function serverSupabaseClient(...args: any[]): any;
  export function createServerSupabaseClient(...args: any[]): any;
}

declare function defineEventHandler<T = any>(handler: (event?: any) => T): any;
declare function createError(payload: any): any;
declare function sendError(event: any, err: any): any;
declare function readMultipartFormData(event: any): Promise<any>;

// h3 / Nitro helper shims often auto-imported by Nuxt. Add permissive
// declarations so server route files compile during remediation.
declare function getQuery<T = any>(event?: any): T;
declare function readBody<T = any>(event?: any): Promise<T>;
declare function getHeader(event: any, name: string): string | undefined;
declare function setHeader(event: any, name: string, value: string): void;
declare function getRouterParam(event: any, name: string): string | undefined;


declare module 'aws-sdk';
declare module 'axios';

// Shims for internal server utility modules that are used widely.
declare module '~/server/utils/database' {
  export const db: any;
  export const supabase: any;
  export function getSupabaseClient(...args: any[]): any;
  export function getSupabaseAdminClient(...args: any[]): any;
}

// Nitro plugin helper used in server plugins
declare function defineNitroPlugin<T = any>(fn: (nitroApp: any) => T): T;

declare module './auth-utils' {
  export const supabase: any;
  export const serverSupabaseClient: any;
}

declare module '~/server/gateway/auth/auth-utils' {
  export const supabase: any;
  export const serverSupabaseClient: any;
}

declare namespace NodeJS {
  interface Process {
    // Nuxt attaches `process.dev` at runtime. Make it optional here.
    dev?: boolean;
  }
}

// Minimal domain type placeholders used by several stores/files.
type VerificationStatus = 'none' | 'pending' | 'verified' | 'approved' | 'rejected';
type BadgeRequest = { id?: string; status?: VerificationStatus; [k: string]: any };
type UniverseMessage = { id: string; text?: string; userId?: string; [k: string]: any };

declare module '~/types/roles' {
  export type Role = any;
  export type Permission = any;
}
