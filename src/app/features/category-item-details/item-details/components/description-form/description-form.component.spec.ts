import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DescriptionFormComponent } from './description-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

describe('DescriptionFormComponent', () => {
  let component: DescriptionFormComponent;
  let fixture: ComponentFixture<DescriptionFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DescriptionFormComponent],
      imports: [FormsModule, ReactiveFormsModule, IonicModule]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DescriptionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
