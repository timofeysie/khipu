import { Component, OnInit, ElementRef } from '@angular/core';
import { environment } from '@env/environment';
import { ThemeService } from '@app/core';
import { PopoverController } from '@ionic/angular';
import { Events } from '@ionic/angular';

const themes = {
  autumn: {
    primary: '#F78154',
    secondary: '#4D9078',
    tertiary: '#B4436C',
    light: '#FDE8DF',
    medium: '#FCD0A2',
    dark: '#B89876'
  },
  night: {
    primary: '#8CBA80',
    secondary: '#FCFF6C',
    tertiary: '#FE5F55',
    medium: '#BCC2C7',
    dark: '#F7F7FF',
    light: '#495867'
  },
  neon: {
    primary: '#39BFBD',
    secondary: '#4CE0B3',
    tertiary: '#FF5E79',
    light: '#F4EDF2',
    medium: '#B682A5',
    dark: '#34162A'
  },
  aisle_plus: {
    primary: '#3a3a3a',
    secondary: '#627ecc',
    tertiary: '#0edd21',
    light: '#F4EDF2',
    medium: '#B682A5',
    dark: '#34162A'
  }
};

@Component({
  selector: 'app-theme',
  templateUrl: './theme.component.html',
  styleUrls: ['./theme.component.scss']
})
export class ThemeComponent implements OnInit {
  slideType = 'default';
  currentPopover: any;
  quantum = 4; // spacing-unit
  borderWidth = 0;
  borderRadius = 0;
  columns = 3; // margins
  gutter = 2; // grid-columns
  version: string | null = environment.version;
  public themeService: ThemeService;

  constructor(
    private _themeService: ThemeService,
    private elementRef: ElementRef,
    public popoverController: PopoverController,
    private events: Events
  ) {
    this.themeService = _themeService;
  }

  ngOnInit() {
    this.elementRef.nativeElement.style.setProperty('--spacing-unit', this.quantum + 'px');
    this.elementRef.nativeElement.style.setProperty('--grid-columns', this.columns);
    this.elementRef.nativeElement.style.setProperty('--margins', this.gutter + 'px');
    this.gutterChange();
    this.events.subscribe('popoever-event', data => {
      this.slideType = data.key;
      this.themeService.slideOptions(data.key);
      this.dismissPopover();
    });
  }

  dismissPopover() {
    if (this.currentPopover) {
      this.currentPopover.dismiss().then(() => {
        this.currentPopover = null;
      });
    }
  }

  borderWidthChange() {
    this.elementRef.nativeElement.style.setProperty('--border-width', this.borderWidth + 'px');
  }

  borderRadiusChange() {
    this.elementRef.nativeElement.style.setProperty('--border-radius', this.borderRadius + 'px');
  }

  quantumChange() {
    this.elementRef.nativeElement.style.setProperty('--spacing-unit', this.quantum + 'px');
  }

  columnsChange() {
    this.elementRef.nativeElement.style.setProperty('--grid-columns', this.columns);
  }

  gutterChange() {
    this.elementRef.nativeElement.style.setProperty('--grid-gutter', this.gutter + 'px');
  }

  changeTheme(name: string) {
    this.themeService.setTheme(themes[name]);
  }

  changeSpeed(val: string) {
    this.themeService.setVariable('--speed', `${val}ms`);
  }
}
