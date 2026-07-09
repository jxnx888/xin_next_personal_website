export interface MenuItem {
  id: number;
  name: string;
  routerLink: string;
}

export const menuData: MenuItem[] = [
  { id: 1, name: 'HOME',     routerLink: '/'        },
  { id: 2, name: 'PROJECTS', routerLink: '/projects' },
  { id: 3, name: 'BLOG',     routerLink: '/blog'     },
  { id: 4, name: 'RESUME',   routerLink: '/resume'   },
  { id: 5, name: 'CONTACT',  routerLink: '/contact'  },
];
