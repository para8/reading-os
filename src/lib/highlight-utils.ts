import type { Highlight } from "./supabase";

export function getSelectionOffsets(
  container: Element,
  sel: Selection
): { start: number; end: number; text: string } | null {
  if (!sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  const text = range.toString();
  if (!text.trim()) return null;

  // Use a Range from container start to selection start to count characters
  const pre = document.createRange();
  pre.setStart(container, 0);
  pre.setEnd(range.startContainer, range.startOffset);
  const start = pre.toString().length;
  return { start, end: start + text.length, text };
}

export function clearHighlightMarks(container: Element): void {
  container.querySelectorAll("mark[data-highlight-id]").forEach((mark) => {
    const parent = mark.parentNode!;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  });
}

export function applyHighlightMarks(
  container: Element,
  highlights: Highlight[]
): Map<string, HTMLElement> {
  const markMap = new Map<string, HTMLElement>();
  if (!highlights.length) return markMap;

  // Sort highlights left to right so we process them in order
  const sorted = [...highlights].sort((a, b) => a.start_offset - b.start_offset);

  // Collect all text nodes in document order
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    textNodes.push(node as Text);
    node = walker.nextNode();
  }

  // We'll work through sorted highlights one by one.
  // For each highlight, walk text nodes until we've consumed start_offset chars,
  // then wrap text up to end_offset in a <mark>.
  // We need to re-collect text nodes after each DOM mutation.

  for (const highlight of sorted) {
    applyOneHighlight(container, highlight, markMap);
  }

  return markMap;
}

function applyOneHighlight(
  container: Element,
  highlight: Highlight,
  markMap: Map<string, HTMLElement>
): void {
  // Re-collect text nodes each time since previous highlight may have split nodes
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let n = walker.nextNode();
  while (n) {
    // Skip text nodes already inside a <mark> for a different highlight
    textNodes.push(n as Text);
    n = walker.nextNode();
  }

  let charCount = 0;
  let started = false;
  let firstMark: HTMLElement | null = null;
  let currentMark: HTMLElement | null = null;

  for (let i = 0; i < textNodes.length; i++) {
    const textNode = textNodes[i];
    const nodeLen = textNode.length;
    const nodeStart = charCount;
    const nodeEnd = charCount + nodeLen;

    if (!started && highlight.start_offset < nodeEnd) {
      // Highlight starts in this node
      const splitOffset = highlight.start_offset - nodeStart;

      let targetNode = textNode;
      if (splitOffset > 0) {
        // Split off the text before the highlight
        textNode.splitText(splitOffset);
        targetNode = textNode.nextSibling as Text;
      }

      // Does it also end in this node?
      const remainingLen = targetNode.length;
      const highlightLen = highlight.end_offset - highlight.start_offset;

      currentMark = createMark(highlight.id);
      firstMark = currentMark;
      targetNode.parentNode!.insertBefore(currentMark, targetNode);

      if (highlightLen <= remainingLen) {
        // Entire highlight fits in this node
        if (highlightLen < remainingLen) {
          targetNode.splitText(highlightLen);
        }
        currentMark.appendChild(targetNode);
        break;
      } else {
        // Highlight spans into next node(s)
        currentMark.appendChild(targetNode);
        started = true;
        charCount = highlight.start_offset + remainingLen;
        continue;
      }
    }

    if (started) {
      const consumed = charCount - highlight.start_offset;
      const remaining = highlight.end_offset - highlight.start_offset - consumed;

      if (remaining <= nodeLen) {
        // Highlight ends in this node
        if (remaining < nodeLen) {
          textNode.splitText(remaining);
        }
        currentMark!.appendChild(textNode);
        break;
      } else {
        currentMark!.appendChild(textNode);
        charCount += nodeLen;
        continue;
      }
    }

    charCount += nodeLen;
  }

  if (firstMark) {
    markMap.set(highlight.id, firstMark);
    // Append delete button inside the mark
    appendDeleteButton(firstMark, highlight.id);
  }
}

function createMark(highlightId: string): HTMLElement {
  const mark = document.createElement("mark");
  mark.dataset.highlightId = highlightId;
  mark.className = "bg-yellow-200 relative group/mark cursor-default rounded-sm";
  return mark;
}

function appendDeleteButton(mark: HTMLElement, highlightId: string): void {
  const btn = document.createElement("button");
  btn.dataset.deleteHighlightId = highlightId;
  btn.className =
    "absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover/mark:opacity-100 " +
    "transition-opacity bg-gray-800 text-white text-xs rounded px-1.5 py-0.5 leading-none select-none z-10";
  btn.textContent = "×";
  btn.setAttribute("aria-label", "Remove highlight");
  mark.appendChild(btn);
}
