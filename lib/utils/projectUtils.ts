import { ProjectsResponse, ProjectsData, Project } from '../types/project';

export async function getProjectsData(locale: string): Promise<ProjectsData> {
  try {
    const url = locale === 'zh' ? '/mock/projectsCN.json' : '/mock/projects.json';
    const response = await fetch(url);
    const data: ProjectsResponse = await response.json();

    if (data.code === 200) {
      return data.data;
    }
    return {};
  } catch (error) {
    console.error('Error loading projects:', error);
    return {};
  }
}

// Filter out 3D projects (code 3, 4) as per requirements
export function filterProjects(projects: Project[]): Project[] {
  return projects.filter(project => project.code !== 3 && project.code !== 4);
}
