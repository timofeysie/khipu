import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ThemeComponent } from './theme.component';
import { ThemeService } from '@app/core';

describe('ThemeComponent', () => {
  let component: ThemeComponent;
  let fixture: ComponentFixture<ThemeComponent>;

  beforeEach(async(() => {
    //const spy = jasmine.createSpyObj('theme', ['getTheme']);
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [ThemeComponent]
      // providers: [ { provide: ThemeService, useValue: spy}]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
