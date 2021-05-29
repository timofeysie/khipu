import { async, ComponentFixture, TestBed } from '@angular/core/testing';
// import { CategoriesContainerComponent } from './categories-container.component';
import { ItemDetailsContainerComponent } from './item-details-container.component';
// category-item-details\item-details\container\item-details\

describe('ItemDetailsContainerComponent', () => {
  let component: ItemDetailsContainerComponent;
  let fixture: ComponentFixture<ItemDetailsContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ItemDetailsContainerComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemDetailsContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
