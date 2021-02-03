// Forked from https://github.com/deno-library/template

type Data = Record<string, unknown>;

export interface ConstructorOptions {
  open?: string;
  close?: string;
  isEscape?: boolean;
}

export default class Template {
  open: string;
  close: string;
  isEscape: boolean;

  constructor(options?: ConstructorOptions) {
    this.open = options?.open ?? "{{";
    this.close = options?.close ?? "}}";
    this.isEscape = options?.isEscape ?? true;
  }

  render(str: string, data: Data): string {
    const reg = new RegExp(`${this.open}([\\s\\S]+?)${this.close}`, "g");
    const result = str.replace(reg, (match, key: string): string => {
      let value = data;
      const segments = key.replace(/ /g, "").split(".");

      for (const segment of segments) {
        if (typeof value === "object" && value !== null && segment in value) {
          // deno-lint-ignore no-explicit-any
          value = value[segment] as any;
        } else {
          return match;
        }
      }

      return this.escape(value);
    });

    return result;
  }

  // deno-lint-ignore no-explicit-any
  escape(str: any): string {
    if (typeof str === "object") {
      str = JSON.stringify(str);
    }
    str = String(str);
    if (this.isEscape === false) return str;
    return str.replace(/&(?!\w+;)/g, "&amp;")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
