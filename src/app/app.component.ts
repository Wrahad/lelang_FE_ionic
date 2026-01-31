import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { IonApp, IonRouterOutlet } from "@ionic/angular/standalone";
import { AppInitializerService } from "./core/services/app-initializer.service";
import { AuthService } from "./core/services/auth.service";
import { NavigationService } from "./core/services/navigation.service";
import { BackButtonHandlerService } from "./core/services/back-button-handler.service";
import { addIcons } from 'ionicons';
import { 
  close, 
  checkmarkCircle, 
  alertCircle, 
  warningOutline,
  informationCircle 
} from 'ionicons/icons';

// Register global icons used by ToastService and common UI elements
addIcons({ 
  close, 
  'checkmark-circle': checkmarkCircle, 
  'alert-circle': alertCircle,
  'warning-outline': warningOutline,
  'information-circle': informationCircle
});

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, AfterViewInit {
  constructor(
    private appInitializer: AppInitializerService,
    private authService: AuthService,
    private navigation: NavigationService,
    private backButtonHandler: BackButtonHandlerService,
  ) {}

  @ViewChild(IonRouterOutlet, { static: false }) routerOutlet?: IonRouterOutlet; 

  async ngOnInit(): Promise<void> {
    await this.appInitializer.initialize();

    await this.authService.initialize();
    this.navigation.handleInitialRouting();
    this.backButtonHandler.initialize();
  }

  ngAfterViewInit(): void {
    if (this.routerOutlet) {
      this.backButtonHandler.setRouterOutlet(this.routerOutlet);
    }
  }
}