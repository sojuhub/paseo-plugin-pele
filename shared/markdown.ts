import { lexer, type Token, type Tokens } from "marked";

export type MarkdownToken = Token;
export function parseMarkdown(text: string): MarkdownToken[] {
  return lexer(text, { gfm: true });
}

export function safeLinkHref(href: string): string | undefined {
  try {
    const url = new URL(href);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? href : undefined;
  } catch {
    return undefined;
  }
}

export function inlineTokens(token: Tokens.Text | Tokens.Paragraph | Tokens.Heading | Tokens.Strong | Tokens.Em | Tokens.Del | Tokens.Link): Token[] {
  return token.tokens ?? [];
}

export function tokenText(token: Token): string {
  if ("text" in token && typeof token.text === "string") return token.text;
  if ("raw" in token && typeof token.raw === "string") return token.raw;
  return "";
}
