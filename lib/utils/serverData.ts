import fs from 'fs';
import path from 'path';
import type { BlogPost } from '@/lib/types/blog';
import type { ProjectsData } from '@/lib/types/projects';

export function getServerBlogData(locale: string): BlogPost[] {
  try {
    const filename = locale === 'zh' ? 'blogCN.json' : 'blogEN.json';
    const filePath = path.join(process.cwd(), 'public', 'mock', filename);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (raw.code !== 200) return [];
    return (raw.data as BlogPost[]).map((post) => ({
      ...post,
      content: post.content.replace(/<div class="cnblogs_code_toolbar">[\s\S]*?<\/div>/g, ''),
    }));
  } catch {
    return [];
  }
}

export function getServerProjectsData(locale: string): ProjectsData {
  try {
    const filename = locale === 'zh' ? 'projectsCN.json' : 'projects.json';
    const filePath = path.join(process.cwd(), 'public', 'mock', filename);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return raw.code === 200 ? raw.data : {};
  } catch {
    return {};
  }
}
