import { remark } from 'remark';
import html from 'remark-html';

/**
 * Preprocess markdown to fix common formatting issues
 * - Convert inline numbered lists (e.g., "1. ... 2. ...") to proper multi-line lists
 */
function preprocessMarkdown(markdown: string): string {
  // Match patterns like "1. text 2. text 3. text" and add newlines before each number
  // Replace number followed by dot and space with newline + number
  return markdown.replace(/(\s|^)(\d+\.\s)/g, '\n$2').trim();
}

export async function markdownToHtml(markdown: string): Promise<string> {
  const processed = preprocessMarkdown(markdown);
  const result = await remark().use(html).process(processed);
  return result.toString();
}
