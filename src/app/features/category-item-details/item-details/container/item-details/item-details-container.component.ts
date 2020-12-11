import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { I18nService } from '@app/core';
import { ItemDetailsStore } from '../../item-details-store';
import { ItemsStore } from '../../../items/items.store';

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
export class ItemDetailsContainerComponent implements OnInit {
  isLoading = false;
  label: Label;
  siteLink: string;
  aliases: string | undefined;
  language: string;
  selectedCategory: string;
  constructor(
    public store: ItemDetailsStore,
    public itemsStore: ItemsStore,
    private i18nService: I18nService,
    private activatedRoute: ActivatedRoute
  ) {
    this.activatedRoute.paramMap.subscribe(params => {
      this.selectedCategory = params.get('selectedCategory');
    });
  }

  ngOnInit() {
    setTimeout(() => {
      this.language = this.i18nService.language.substring(0, 2);
    }, 1600);
  }

  updateLanguage(event: any) {
    this.language = event.detail.value;
  }
}
