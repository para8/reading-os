import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

export interface ParsedArticle {
  title: string | null | undefined;
  content: string | null | undefined;
  textContent: string | null | undefined;
  excerpt: string | null | undefined;
}

export function parseHtml(html: string, url: string): ParsedArticle | null {
  const { document, location } = parseHTML(html);
  const documentUrl = new URL(url).href;

  Object.defineProperty(document.defaultView, "location", {
    configurable: true,
    value: location ?? new URL(documentUrl),
  });

  Object.defineProperty(document, "documentURI", {
    configurable: true,
    value: documentUrl,
  });

  const reader = new Readability(document);
  const article = reader.parse();
  return article;
}
