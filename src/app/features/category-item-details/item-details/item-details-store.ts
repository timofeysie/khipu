import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@app/store';
import { ItemDetailsState } from './item-details-store-state';
import { ItemDetails } from '@app/core/interfaces/item-details';
import { I18nService } from '@app/core';
import { RealtimeDbService } from '@app/core/firebase/realtime-db.service';
import { environment } from '@env/environment.prod';
import { CategoryItemDetailsService } from '../category-item-details.service';
import { Logger } from '@app/core/logger.service';

const log = new Logger('ItemDetailsStore');

@Injectable()
export class ItemDetailsStore extends Store<ItemDetailsState> {
  ENTITIES_KEY = 'entities';
  selectedCategory: string;
  constructor(
    private i18nService: I18nService,
    private activatedRoute: ActivatedRoute,
    private realtimeDbService: RealtimeDbService,
    private categoryItemDetailsService: CategoryItemDetailsService
  ) {
    super(new ItemDetailsState());
    this.fetchDetails();
    this.activatedRoute.paramMap.subscribe(params => {
      this.selectedCategory = params.get('selectedCategory');
    });
  }

  fetchDetails() {
    const currentLanguage = this.i18nService.language;
    const sparqlLanguages = environment.sparqlLanguages;
    const sparqlLanguageObject = sparqlLanguages.find(i => i.appLanguage === currentLanguage);
    this.activatedRoute.paramMap.subscribe(params => {
      const qcode = params.get('qcode');
      this.fetchDetailsFromEndpoint(qcode, sparqlLanguageObject.sparqlLanguage);
    });
  }

  fetchDetailsFromEndpoint(_qcode: string, language: string) {
    this.categoryItemDetailsService.getItemDetails({ qcode: _qcode }).subscribe((response: string) => {
      const itemDetails: ItemDetails = response[this.ENTITIES_KEY][_qcode];
      // this is the key to save the user description back to the item in the list
      // the title of the detail might be different that the name used in the Wikidata list
      const itemListLabelKey = itemDetails.labels[language]['value'];
      console.log('got itemListLabelKey:', itemListLabelKey);
      this.state.itemDetails = itemDetails;
      const title = this.getTitle(itemDetails, language);
      if (title) {
        this.fetchDescription(title, language, itemListLabelKey);
      }
    });
  }

  getTitle(itemDetails: any, language: string) {
    if (itemDetails.sitelinks[language + 'wiki']) {
      const link: string = itemDetails.sitelinks[language + 'wiki']['url'];
      const titleStart = link.lastIndexOf('/');
      const title = link.substring(titleStart + 1, link.length);
      return title;
    } else {
      return null;
    }
  }

  fetchDescription(_title: string, _language: string, itemListLabelKey: string) {
    const sparqlLanguageObject = this.getSPARQL();
    // TODO: check firebase first
    this.activatedRoute.paramMap.subscribe(() => {
      this.fetchWikimediaDescriptionFromEndpoint(_title, sparqlLanguageObject.sparqlLanguage, itemListLabelKey);
    });
  }

  fetchDescriptionFromEndpoint(_title: string, _language: string) {
    this.categoryItemDetailsService
      .getItemDescription({ title: _title, language: _language })
      .subscribe((response: string) => {
        this.state.description = response['description'];
      });
  }

  fetchWikimediaDescriptionFromEndpoint(_title: string, _language: string, itemListLabelKey: string) {
    this.categoryItemDetailsService
      .getWikidediaDescription({ title: _title, language: _language })
      .subscribe((response: any) => {
        if (response['query']) {
          const firstItem = Object.keys(response['query']['pages'])[0];
          this.state.wikimediaDescription = response['query']['pages'][firstItem]['extract'];
          // TODO: set in db also
          // check if a user description exists,
          // if not, set a portion of the description.
          this.activatedRoute.paramMap.subscribe(params => {
            this.selectedCategory = params.get('selectedCategory');
            this.fetchFirebaseItemAndUpdate(this.selectedCategory, this.state.wikimediaDescription, itemListLabelKey);
          });
        } else {
          const sparqlLanguageObject = this.getSPARQL();
          this.fetchDescriptionFromEndpoint(_title, sparqlLanguageObject.sparqlLanguage);
        }
      });
  }

  fetchFirebaseItemAndUpdate(itemLabel: string, description: string, itemListLabelKey: string) {
    this.realtimeDbService
      .readUserSubDataItem('items', itemLabel, itemListLabelKey)
      .then(existingItem => {
        if (existingItem && existingItem['user-description'] === '') {
          // pre-fill blank descriptions and save them back to the db
          const n = 100; // TODO: move this value into user preferences.
          const defaultDescription = description.length > n ? description.substr(0, n - 1) + '...' : description;
          console.log('default', defaultDescription);
          existingItem['user-description'] = defaultDescription;
          this.realtimeDbService.writeDescription(existingItem, itemLabel, itemListLabelKey);
        }
      })
      .catch(error => {
        log.error('error', error);
      });
  }

  getSPARQL() {
    const currentLanguage = this.i18nService.language;
    const sparqlLanguages = environment.sparqlLanguages;
    const sparqlLanguageObject = sparqlLanguages.find(i => i.appLanguage === currentLanguage);
    return sparqlLanguageObject;
  }
}
