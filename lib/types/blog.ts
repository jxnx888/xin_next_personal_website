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
  'Coveo': '#0d1136',
  'JavaScript': '#fcdc00',
  'TypeScript': '#3178c6',
  'Node.js': '#d52bb3',
  'MongoDB': '#8ad684',
  'IOS': '#000000',
  'Microsoft Exchange Server': '#0272b9',
  'CSS': '#226d9e',
  'React': '#61dafb',
  'Vue.js': '#42b883',
  'Next.js': '#000000',
  'Nextjs': '#000000',
  'GraphQL': '#e10098',
  'Vercel': '#000000',
};
