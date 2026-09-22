export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

// Three shapes, cheapest first. `abstract` and `readTime` are both derived from
// the article body, so anything that needs them costs a content fetch per post;
// BlogIndexItem is the only one that comes from a single Notion query.

/** Metadata only — one `databases.query`, no per-post content fetch. */
export interface BlogIndexItem {
  id: string; // slug for Notion posts, stringified number for JSON fallback
  title: string;
  time: string;
  type: string[]; // Array of tags
}

/** What the list and card views need. Body is deliberately absent: it was 600 KB
 *  of the blog list page's HTML and nothing rendered it. */
export interface BlogSummary extends BlogIndexItem {
  abstract: string;
  readTime: number;
}

/** Full article, for the detail page. */
export interface BlogPost extends BlogIndexItem {
  abstract: string;
  content: string; // HTML content
}

export interface BlogData {
  code: number;
  data: BlogPost[];
}

export type TagCount = Record<string, number>;

export const TAG_COLORS: Record<string, string> = {
  'Coveo': '#1a6bff',
  'JavaScript': '#f59e0b',
  'TypeScript': '#3b82f6',
  'Node.js': '#d52bb3',
  'MongoDB': '#4ade80',
  'iOS': '#60a5fa',
  'Microsoft Exchange Server': '#38bdf8',
  'CSS': '#38bdf8',
  'React': '#22d3ee',
  'Vue.js': '#34d399',
  'Nextjs': '#94a3b8',
  'GraphQL': '#e879f9',
  'Vercel': '#94a3b8',
};
