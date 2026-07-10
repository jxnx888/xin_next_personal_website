export interface Project {
  title: string;
  img: string;
  desc: string;
  tags: string;
  url?: string;
  code: number;
  codeUrl?: string;
  storeUrlQr?: {
    ios?: string;
    android?: string;
  };
}

export interface Career {
  companyName: string;
  /** Short company label used in the section scroll-menu */
  companySC: string;
  jobtitle: string;
  responsibilities: string[];
  startDate: string;
  endDate: string;
  duration: string;
  projects: Project[];
}

export type ProjectsData = Record<string, Career>;

export interface ProjectsResponse {
  code: number;
  data: ProjectsData;
}
