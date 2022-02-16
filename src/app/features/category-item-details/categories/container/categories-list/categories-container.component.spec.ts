import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { CategoriesContainerComponent } from './categories-container.component';
import { CategoryComponent } from '../../../../category-item-details/categories/components/categories-list/category.component';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

describe('CategoriesComponent', () => {
  let component: CategoriesContainerComponent;
  let fixture: ComponentFixture<CategoriesContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule, RouterModule, HttpClientModule],
      declarations: [CategoriesContainerComponent, CategoryComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CategoriesContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
