// Type shim for third-party packages that ship without their own declarations.
declare module 'emoji-js' {
  export default class EmojiConvertor {
    replace_colons(str: string): string
    replace_unified(str: string): string
    replace_emoticons(str: string): string
    replace_emoticons_with_colons(str: string): string
    text_mode: boolean
    colons_mode: boolean
    img_set: string
    img_sets: Record<string, { path: string; sheet?: string; mask?: string }>
    init_env(): void
  }
}
