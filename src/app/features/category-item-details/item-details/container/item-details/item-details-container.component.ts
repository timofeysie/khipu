import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { I18nService } from '@app/core';
import { ItemDetailsStore } from '../../item-details-store';

interface Label {
  language: string;
  value: string;
}
@Component({
  selector: 'app-item-details-container',
  templateUrl: './item-details-container.component.html',
  styleUrls: ['./item-details-container.component.scss'],
  providers: [ItemDetailsStore]
})
export class ItemDetailsContainerComponent implements OnInit, AfterViewInit {
  isLoading = false;
  label: Label;
  labelStr: string;
  siteLink: string;
  aliases: string | undefined;
  language: string;
  selectedCategory: string;
  rawSelectedCategory: string;
  constructor(
    public store: ItemDetailsStore,
    public itemsDetailsStore: ItemDetailsStore,
    private i18nService: I18nService,
    private activatedRoute: ActivatedRoute
  ) {
    this.activatedRoute.paramMap.subscribe(params => {
      this.rawSelectedCategory = params.get('selectedCategory');
      this.selectedCategory = this.rawSelectedCategory.replace('_', ' ');
      this.labelStr = params.get('label');
    });
  }

  ngOnInit() {
    setTimeout(() => {
      this.language = this.i18nService.language.substring(0, 2);
    }, 1600);
  }

  ngAfterViewInit() {}

  updateLanguage(event: any) {
    this.language = event.detail.value;
  }

  onDescriptionUpdated(event: any) {
    if (event.label) {
      this.itemsDetailsStore.updateUserDescription(event.newDescription, event.label, this.rawSelectedCategory);
    }
  }
}
