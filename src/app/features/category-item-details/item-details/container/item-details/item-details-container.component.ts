import { Component, OnInit } from '@angular/core';
import { I18nService } from '@app/core';
import { CategoryItemDetailsService } from '../../../category-item-details.service';
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
export class ItemDetailsContainerComponent implements OnInit {
  isLoading = false;
  label: Label;
  siteLink: string;
  aliases: string | undefined;
  language: string;
  constructor(public store: ItemDetailsStore, private i18nService: I18nService) {
    this.language = this.i18nService.language.substring(0, 2);
  }

  ngOnInit() {}

  updateLanguage(event: any) {
    console.log('eve', event.detail.value);
    this.language = event.detail.value;
  }
}
