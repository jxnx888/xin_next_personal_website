export interface MenuItem {
  id: number;
  name: string;
  routerLink: string;
}

export const menuData: MenuItem[] = [
  { id: 1, name: 'HOME',     routerLink: '/'        },
  { id: 2, name: 'PROJECTS', routerLink: '/projects'        },
  { id: 3, name: 'GAMES',    routerLink: '/projects/roblox' },
  { id: 4, name: 'BLOG',     routerLink: '/blog'            },
  { id: 5, name: 'RESUME',   routerLink: '/resume'          },
  { id: 6, name: 'CONTACT',  routerLink: '/contact'         },
];
