import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'management/team',
        pathMatch: 'full',
      },
      {
        path: 'management/team',
        loadComponent: () => import('./routes/management/team/view.component'),
      },
    ],
  },
];
