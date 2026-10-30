export interface Project {
  title: string;
  img: string;
  desc: string;
  tags: string;
  url?: string;
  routeLink?: string;
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
  /** "YYYY/MM" */
  startDate: string;
  /** "YYYY/MM", or "Present" / "至今" for the current role */
  endDate: string;
  /** Computed from the dates in getServerProjectsData — not stored in the JSON */
  duration: string;
  projects: Project[];
}

export type ProjectsData = Record<string, Career>;

export interface ProjectsResponse {
  code: number;
  data: ProjectsData;
}
