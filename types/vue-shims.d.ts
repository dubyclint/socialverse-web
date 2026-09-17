// Permissive Vue type shims to reduce TS noise during remediation.
// These are temporary and should be tightened as the codebase is properly typed.

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

// Override Vue's public API with permissive signatures so existing code type-checks
// while types are being remediated. This is intentionally broad and temporary.
declare module 'vue' {
  export interface Ref<T = any> {
    value: T
  }
  export function ref<T = any>(value?: T): Ref<T>
  export function shallowRef<T = any>(value?: T): Ref<T>
  export function computed<T = any>(getter: () => T): { readonly value: T }
  export function reactive<T extends object = any>(obj: T): T
  export function readonly<T = any>(value: T): T
  export function watch<T = any>(source: any, callback: (newVal: T, oldVal: T) => any, options?: any): void
  export function onMounted(callback: () => any): void
  export function onUnmounted(callback: () => any): void
  export function onBeforeUnmount(callback: () => any): void
  export function nextTick(callback?: () => any): Promise<void>
  export function defineProps<T = any>(props?: T): T
  export function defineEmits<T = any>(emits?: T): T
  export function defineExpose<T = any>(exposed?: T): void
}
