import { Component, OnInit, OnDestroy } from "@angular/core";
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from "@angular/router";
import { addIcons  } from "ionicons";
import { helpCircleOutline, logOutOutline, menuOutline, personCircleOutline, camera, add, closeOutline, leaf, leafOutline, home, chevronForwardOutline, timeOutline, personOutline, chevronDown, chevronDownOutline, powerOutline, menu, homeOutline} from "ionicons/icons";
import { ModalController, AlertController} from '@ionic/angular/standalone';
import { filter, Subject, takeUntil } from "rxjs";
import { AuthService } from "src/app/core/services/auth.service";
import { HelpDialogComponent } from "src/app/shared/components/help-dialog/help-dialog.component";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { Platform } from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular/standalone';
import { UserMenuPopoverComponent } from "src/app/shared/components/user-menu-popover/user-menu.component";


interface PageInfo {
  title: string;
  subtitle: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  templateUrl: './layout.page.html',
  styleUrls: ['./layout.page.scss'],
  standalone: true,
  imports: [
    CommonModule,       
    RouterLink,        
    RouterLinkActive, 
    IonicModule
  ],
})
export class LayoutPage implements OnInit, OnDestroy {

  isLoading = false;
  currentPage: PageInfo = {
    title: '',
    subtitle: '',
    icon: ''
  };

  private pageConfig: { [key: string]: PageInfo} = {
    '/home/lelang': { title: 'Lelang', subtitle: 'Temukan lelang terbaik', icon: 'home-outline' },
    '/home/riwayat': { title: 'Riwayat', subtitle: 'Lihat aktivitas anda', icon: 'time-outline' },
    '/home/profil': { title: 'Profil', subtitle: 'Kelola akun anda', icon: 'person-outline' },
  }

  // isSidebarOpen sudah didefinisikan di bawah

  constructor(
    private auth: AuthService,
    private router: Router,
    private modalCtrl: ModalController, 
    private alertCtrl: AlertController,
    private platform: Platform,
    private popoverCtrl: PopoverController,
  ) {
    addIcons({closeOutline,leafOutline,home,chevronForwardOutline,timeOutline,personOutline,logOutOutline,menuOutline,chevronDownOutline,helpCircleOutline,powerOutline,chevronDown,menu,leaf,add,camera,personCircleOutline,homeOutline});
  }

  private updatePageInfo(url: string) {
    const pageKey = Object.keys(this.pageConfig).find(key => url.startsWith(key));
    if (pageKey) {
      this.currentPage = this.pageConfig[pageKey];
    } else {
      this.currentPage = this.pageConfig['/home/lelang'];
    }
  }

  // User display info - updated via subscription
  currentUserDisplay = {
    name: 'Pengguna',
    email: 'Tidak Diketahui',
    initial: '?'
  };

  isSidebarOpen = false;
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // Subscribe to router events
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.updatePageInfo(event.urlAfterRedirects);
      this.isSidebarOpen = false;
    });
    this.updatePageInfo(this.router.url);

    // Subscribe to user changes
    this.auth.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUserDisplay = {
        name: user?.name ?? 'Pengguna',
        email: user?.email ?? 'Tidak Diketahui',
        initial: (user?.name ?? '?').charAt(0).toUpperCase()
      };
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  onProfileSelected() {
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      setTimeout(() => {
        this.router.navigateByUrl('/home/profil');
      }, 100);
    } else {
      this.router.navigateByUrl('/home/profil');
    }
  }

  // async onLogout() {
  //   const alert = await this.alertCtrl.create({
  //     header: 'Konfirmasi Logout',
  //     message: 'Apakah Anda yakin ingin keluar dari aplikasi?',
  //     cssClass: 'custom-alert',
  //     buttons: [
  //       { text: 'Batal', role: 'cancel' },
  //       {
  //         text: 'Keluar',
  //         role: 'destructive',
  //         cssClass: 'alert-button-danger',
  //         handler: () => {
  //           this.auth.logout().subscribe();
  //         }
  //       }
  //     ]
  //   }
  //   );
  //   await alert.present();
  // }

  async onLogout() {
  const alert = await this.alertCtrl.create({
    header: 'Konfirmasi Logout',
    message: 'Apakah Anda yakin ingin keluar dari aplikasi?',
    
    // Class utama untuk styling container
    cssClass: 'custom-alert-logout', 
    
    buttons: [
      {
        text: 'Batal',
        role: 'cancel',
        // Class khusus tombol batal
        cssClass: 'alert-btn-cancel' 
      },
      {
        text: 'Ya, Logout',
        role: 'confirm',
        // Class khusus tombol konfirmasi
        cssClass: 'alert-btn-danger', 
        handler: () => {
          this.auth.logout().subscribe();
        }
      }
    ]
  });

  await alert.present();
}

  async showHelpDialog() {
    const modal = await this.modalCtrl.create({
    component: HelpDialogComponent,
    
    cssClass: 'dialog-modal', 
    
    backdropDismiss: true
  });
  
  await modal.present();
  }

  
  async openUserMenu(ev: Event) {
    ev.preventDefault();
    const popover = await this.popoverCtrl.create({
      component: UserMenuPopoverComponent,
      event: ev,
      side: 'bottom',
      alignment: 'end',
      showBackdrop: true,
      dismissOnSelect: true,
      componentProps: {
        userName: this.currentUserDisplay.name,
        userEmail: this.currentUserDisplay.email
      }
    });
    await popover.present();

    const { data } = await popover.onDidDismiss();
    
    if (data) {
      console.log('🔍 Popover action:', data);
      
      switch (data.action) {
        case 'profile':
          this.onProfileSelected();
          break;
        case 'help':
          this.showHelpDialog();
          break;
        case 'logout':
          this.onLogout();
          break;
      }
    }
  }




}
