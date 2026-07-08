export interface BlogPost {
  id: number;
  title: string;
  time: string;
  type: string[]; // Array of tags
  abstract: string;
  content: string; // HTML content
}

export interface BlogData {
  code: number;
  data: BlogPost[];
}

export interface TagCount {
  [key: string]: number;
}

export const TAG_COLORS: { [key: string]: string } = {
  'Coveo': '#1a6bff',
  'JavaScript': '#f59e0b',
  'TypeScript': '#3b82f6',
  'Node.js': '#d52bb3',
  'MongoDB': '#4ade80',
  'IOS': '#60a5fa',
  'Microsoft Exchange Server': '#38bdf8',
  'CSS': '#38bdf8',
  'React': '#22d3ee',
  'Vue.js': '#34d399',
  'Next.js': '#94a3b8',
  'Nextjs': '#94a3b8',
  'GraphQL': '#e879f9',
  'Vercel': '#94a3b8',
};
