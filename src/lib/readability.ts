import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export interface ParsedArticle {
  title: string | null | undefined;
  content: string | null | undefined;
  textContent: string | null | undefined;
  excerpt: string | null | undefined;
}

export function parseHtml(html: string, url: string): ParsedArticle | null {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  return article;
}
