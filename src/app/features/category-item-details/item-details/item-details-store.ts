import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@app/store';
import { ItemDetailsState } from './item-details-store-state';
import { ItemDetails } from '@app/core/interfaces/item-details';
import { I18nService } from '@app/core';
import { environment } from '@env/environment.prod';
import { CategoryItemDetailsService } from '../category-item-details.service';

@Injectable()
export class ItemDetailsStore extends Store<ItemDetailsState> {
  ENTITIES_KEY = 'entities';
  constructor(
    private i18nService: I18nService,
    private activatedRoute: ActivatedRoute,
    private categoryItemDetailsService: CategoryItemDetailsService
  ) {
    super(new ItemDetailsState());
    this.fetchDetails();
  }

  fetchDetails() {
    const currentLanguage = this.i18nService.language;
    const sparqlLanguages = environment.sparqlLanguages;
    const sparqlLanguageObject = sparqlLanguages.find(i => i.appLanguage === currentLanguage);
    this.activatedRoute.paramMap.subscribe(params => {
      console.log(params.get('qcode'));
      const qcode = params.get('qcode');
      this.fetchDetailsFromEndpoint(qcode, sparqlLanguageObject.sparqlLanguage);
    });
  }

  fetchDetailsFromEndpoint(_qcode: string, language: string) {
    this.categoryItemDetailsService.getItemDetails({ qcode: _qcode }).subscribe((response: string) => {
      const itemDetails: ItemDetails = response[this.ENTITIES_KEY][_qcode];
      this.state.itemDetails = itemDetails;
      console.log('stored state', this.state);
      const title = this.getTitle(itemDetails, language);
      this.fetchDescription(title, language);
    });
  }

  getTitle(itemDetails: any, language: string) {
    const link: string = itemDetails.sitelinks[language + 'wiki']['url'];
    const titleStart = link.lastIndexOf('/');
    const title = link.substring(titleStart + 1, link.length);
    return title;
  }

  fetchDescription(_title: string, _language: string) {
    const currentLanguage = this.i18nService.language;
    const sparqlLanguages = environment.sparqlLanguages;
    const sparqlLanguageObject = sparqlLanguages.find(i => i.appLanguage === currentLanguage);
    this.activatedRoute.paramMap.subscribe(() => {
      this.fetchDescriptionFromEndpoint(_title, sparqlLanguageObject.sparqlLanguage);
    });
  }

  fetchDescriptionFromEndpoint(_title: string, _language: string) {
    this.categoryItemDetailsService
      .getItemDescription({ title: _title, language: _language })
      .subscribe((response: string) => {
        this.state.description = response['description'];
      });
  }
}
