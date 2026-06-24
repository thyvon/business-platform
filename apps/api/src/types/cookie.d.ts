declare module "cookie" {
  export interface ParseOptions {
    decode?(value: string): string;
  }

  export interface SerializeOptions {
    encode?(value: string): string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: boolean | "lax" | "strict" | "none";
    secure?: boolean;
  }

  export function parse(value: string, options?: ParseOptions): Record<string, string | undefined>;
  export function serialize(name: string, value: string, options?: SerializeOptions): string;
}