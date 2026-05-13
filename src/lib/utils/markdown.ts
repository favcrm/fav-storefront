/**
 * Converts EditorJS blocks (or raw HTML) to Markdown format for agent-friendly reading.
 */
export function editorjsToMarkdown(blocksContent: string | null): string {
  if (!blocksContent) return "";

  // Check if it's raw HTML
  if (
    blocksContent.trim().startsWith("<") &&
    !blocksContent.trim().startsWith('{"')
  ) {
    // For raw HTML, we could use a complex parser, but for agents,
    // simply returning the HTML or stripping tags works well enough.
    // We'll return it as is, agents can read HTML easily, but we'll try to clean it slightly.
    return blocksContent;
  }

  let blocks: any[] = [];
  try {
    const parsed = JSON.parse(blocksContent);
    if (parsed.blocks && Array.isArray(parsed.blocks)) {
      blocks = parsed.blocks;
    } else if (Array.isArray(parsed)) {
      blocks = parsed;
    }
  } catch {
    return blocksContent;
  }

  let markdown = "";

  for (const block of blocks) {
    if (!block || !block.type || !block.data) continue;

    const data = block.data;

    switch (block.type) {
      case "paragraph":
        if (data.text) markdown += `${cleanHtmlTags(data.text)}\n\n`;
        break;

      case "header":
        if (data.text) {
          const level = data.level ? Math.min(Math.max(data.level, 1), 6) : 2;
          const hashes = "#".repeat(level);
          markdown += `${hashes} ${cleanHtmlTags(data.text)}\n\n`;
        }
        break;

      case "list":
        if (data.items && Array.isArray(data.items)) {
          const isOrdered = data.style === "ordered";
          data.items.forEach((item: any, index: number) => {
            const prefix = isOrdered ? `${index + 1}.` : "-";
            // EditorJS lists might be arrays of strings or nested objects depending on version
            const text = typeof item === "string" ? item : item.content || "";
            markdown += `${prefix} ${cleanHtmlTags(text)}\n`;
          });
          markdown += "\n";
        }
        break;

      case "image":
        if (data.file && data.file.url) {
          const alt = data.caption || "Image";
          markdown += `![${cleanHtmlTags(alt)}](${data.file.url})\n\n`;
        } else if (data.url) {
          const alt = data.caption || "Image";
          markdown += `![${cleanHtmlTags(alt)}](${data.url})\n\n`;
        }
        break;

      case "quote":
        if (data.text) {
          markdown += `> ${cleanHtmlTags(data.text)}\n`;
          if (data.caption) markdown += `> — ${cleanHtmlTags(data.caption)}\n`;
          markdown += "\n";
        }
        break;

      case "code":
        if (data.code) {
          markdown += "```\n" + data.code + "\n```\n\n";
        }
        break;

      case "delimiter":
        markdown += "---\n\n";
        break;

      default:
        // Attempt to extract any text fields for unknown blocks
        if (data.text) {
          markdown += `${cleanHtmlTags(data.text)}\n\n`;
        }
        break;
    }
  }

  return markdown.trim();
}

/**
 * Removes simple HTML tags often left inside EditorJS text blocks (like <b>, <i>, <br>)
 * Optionally converts standard ones to markdown
 */
function cleanHtmlTags(html: string): string {
  if (!html) return "";
  let text = html;

  // Replace simple formatting
  text = text.replace(/<b\b[^>]*>(.*?)<\/b>/gi, "**$1**");
  text = text.replace(/<strong\b[^>]*>(.*?)<\/strong>/gi, "**$1**");
  text = text.replace(/<i\b[^>]*>(.*?)<\/i>/gi, "*$1*");
  text = text.replace(/<em\b[^>]*>(.*?)<\/em>/gi, "*$1*");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, "");

  return text;
}
