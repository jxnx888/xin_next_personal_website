export interface MenuItem {
  id: number;
  name: string;
  routerLink: string;
  routerName: string;
}

export const menuData: MenuItem[] = [
  {
    id: 1,
    name: 'HOME',
    routerLink: '/',
    routerName: 'Home'
  },
  {
    id: 2,
    name: 'PROJECTS',
    routerLink: '/projects',
    routerName: 'Projects'
  },
  {
    id: 3,
    name: 'BLOG',
    routerLink: '/blog',
    routerName: 'Blog'
  },
  {
    id: 4,
    name: 'RESUME',
    routerLink: '/resume',
    routerName: 'Resume'
  },
  {
    id: 5,
    name: 'CONTACT',
    routerLink: '/contact',
    routerName: 'Contact'
  }
];
