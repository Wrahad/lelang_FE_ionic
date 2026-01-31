import { Routes } from "@angular/router";

export const HOME_ROUTES: Routes = [
    {
        path: 'lelang',
        loadComponent: () => import('../auction/auction-list.page').then(m => m.AuctionListPage),
        data: {
            title: 'Lelang',
            icon: 'home-outline',

        }
    },
    {
        path: 'riwayat',
        loadComponent: () => import('../riwayat/riwayat.page').then(m => m.RiwayatPage),
        data: {
            title: 'Riwayat',
            icon: 'time-outline',
        }
    },
    {
        path: 'profil',
        loadComponent: () => import('../profil/profil.page').then(m => m.ProfilPage),
        data: {
            title: 'Profil',
            icon: 'person-outline',
        }
    },
    {
        path: '',
        redirectTo: 'lelang',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: 'lelang',
    }
]