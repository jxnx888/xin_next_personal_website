export interface Project {
  title: string;
  img: string;
  desc: string;
  tags: string;
  url: string;
  code: number;
  storeUrlQr?: {
    ios?: string;
    android?: string;
  };
}

export interface Company {
  companyName: string;
  companySC: string;
  jobtitle: string;
  responsibilities: string[];
  startDate: string;
  endDate: string;
  duration: string;
  projects: Project[];
}

export interface ProjectsData {
  [key: string]: Company;
}

export interface ProjectsResponse {
  code: number;
  data: ProjectsData;
  companyName: string[];
}
