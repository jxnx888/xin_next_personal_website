import { BlogPost, TagCount } from '@/lib/types/blog';

export async function getBlogData(locale: string): Promise<BlogPost[]> {
  const url = locale === 'zh' ? '/mock/blogCN.json' : '/mock/blogEN.json';

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 200) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error loading blog data:', error);
    return [];
  }
}

export function getTagCounts(blogs: BlogPost[]): TagCount {
  const tagCounts: TagCount = {};

  blogs.forEach((blog) => {
    blog.type.forEach((tag) => {
      if (tagCounts[tag]) {
        tagCounts[tag]++;
      } else {
        tagCounts[tag] = 1;
      }
    });
  });

  return tagCounts;
}

export function filterBlogsByTag(blogs: BlogPost[], tag?: string): BlogPost[] {
  if (!tag) return blogs;
  return blogs.filter((blog) => blog.type.includes(tag));
}

export function getBlogImagePath(tag: string): string {
  // Convert tag to lowercase and remove spaces for image filename
  const filename = tag.toLowerCase().replace(/ /g, '');
  return `/image/blog/${filename}.jpg`;
}
