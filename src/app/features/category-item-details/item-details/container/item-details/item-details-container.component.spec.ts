import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemDetailsContainerComponent } from './item-details-container.component';
import { ItemDetailsComponent } from '../../components/item-details/item-details.component';
import { IonicModule } from '@ionic/angular';
import { I18nService } from '@app/core';

describe('ItemDetailsContainerComponent', () => {
  let component: ItemDetailsContainerComponent;
  let fixture: ComponentFixture<ItemDetailsContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule, I18nService, ItemDetailsComponent],
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
