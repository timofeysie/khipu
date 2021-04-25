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
    const details = this.fetchDetails();
  }

  /**
   *
   * @param detail
   * @param itemLabel
   * @param category
   */
  updateUserDescription(description: any, itemLabel: string, category: string) {
    this.realtimeDbService.writeDescription(description, itemLabel, category);
  }

  fetchDetails() {
    const currentLanguage = this.i18nService.language;
    const sparqlLanguages = environment.sparqlLanguages;
    const sparqlLanguageObject = sparqlLanguages.find(i => i.appLanguage === currentLanguage);
    this.activatedRoute.paramMap.subscribe(params => {
      const qcode = params.get('qcode');
      if (qcode !== 'q') {
        // 1. Wikidata qcode
        this.fetchDetailsFromEndpoint(qcode, sparqlLanguageObject.sparqlLanguage);
      }
      const label = params.get('label');
      if (label) {
        // TODO: refactor this!
        // 2 Wikipedia item
        this.fetchWikimediaDescriptionFromEndpoint(label, 'en', label);
      }
    });
  }

  fetchDetailsFromEndpoint(_qcode: string, language: string) {
    this.categoryItemDetailsService.getItemDetails({ qcode: _qcode }).subscribe((response: string) => {
      const itemDetails: ItemDetails = response[this.ENTITIES_KEY][_qcode];
      // this is the key to save the user description back to the item in the list
      // the title of the detail might be different that the name used in the Wikidata list
      const itemListLabelKey = itemDetails.labels[language]['value'];
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

  /**
   * Get the description from the Wikipedia endpoint and replace relative links
   * with full paths to the wikipedia content.
   *
   * Some old notes on the default description:
   * If the first API call for the description text fails,
   * and there is no existing user description, then we want to
   * parse the HTML out of this response and set the description here
   * @param _title
   * @param _language
   * @param setDefaultDescription (not used)
   */
  fetchDescriptionFromEndpoint(_title: string, _language: string, setDefaultDescription: boolean) {
    this.categoryItemDetailsService
      .getWikipediaItemDescription({ title: _title, language: _language })
      .subscribe((response: string) => {
        // replace relative links with full links
        const baseUrl = 'https://en.wikipedia.org';
        const searchUrl = '/wiki/';
        const replaceUrl = baseUrl + '/wiki/';
        const responseDescription = response['description'];
        const newDescription = responseDescription.split(searchUrl).join(replaceUrl);
        this.state.wikipediaDescription = newDescription;
      });
  }

  fetchWikimediaDescriptionFromEndpoint(_title: string, _language: string, itemListLabelKey: string) {
    this.categoryItemDetailsService
      .getWikimediaDescription({ title: _title, language: _language })
      .subscribe((response: any) => {
        if (response['query']) {
          const firstItem = Object.keys(response['query']['pages'])[0];
          this.state.wikimediaDescription = response['query']['pages'][firstItem]['extract'];
          // TODO: set in db also
          // check if a user description exists,
          // if not, set a portion of the description.
          //const newDefaultUserDescription = this.createDefaultDescription(this.state.wikimediaDescription, _language);
          this.activatedRoute.paramMap.subscribe(params => {
            this.selectedCategory = params.get('selectedCategory');
            this.fetchFirebaseItemAndUpdate(
              this.state.wikimediaDescription,
              itemListLabelKey,
              // newDefaultUserDescription,
              _language
            );
          });
          const sparqlLanguageObject = this.getSPARQL();
          const setDefaultDescription = true;
          this.fetchDescriptionFromEndpoint(_title, sparqlLanguageObject.sparqlLanguage, setDefaultDescription);
        }
      });
  }

  /**
   * This whole series of API and database calls is really brittle.
   * We had added the newDefaultUserDescription so that it can be used as a default
   * user description if there is no existing user description.
   * There must be a design pattern that could be used here.
   * Or an Rxjs functional pipe arrangement that could orchestrate the whole thing.
   * @param itemLabel the name of the item.
   * @param description the item description (from the api)
   * @param itemListLabelKey the item key used to associate this item with it's entry in the item list.
   * @param newDefaultUserDescription If the previous API result had a description,
   */
  fetchFirebaseItemAndUpdate(
    description: string,
    itemListLabelKey: string,
    newDefaultUserDescription?: string,
    language?: string
  ) {
    this.realtimeDbService
      .readUserSubDataItem('items', this.selectedCategory, itemListLabelKey)
      .then((existingItem: any) => {
        if (existingItem && existingItem['user-description'] && existingItem['user-description'] !== '') {
          // #1 if the firebase meta info user description exists, use that this.state.itemDetails.
          this.state.itemDetails = existingItem;
          this.state.itemDetails.userDescription = existingItem['user-description'];
        } else if (existingItem && existingItem['user-description'] === '') {
          // #2: item has only label
          // pre-fill a blank descriptions and save them back to the db
          // not sure if this is a possible situation.  if we have stored a blank description,
          // something is wrong and that should be fixed, and we wont need this block.
          const defaultDescription = this.createDefaultDescription(description, language);
          existingItem.userDescription = defaultDescription;
          this.state.itemDetails.userDescription = defaultDescription;
          // this.realtimeDbService.writeDescription(existingItem, itemListLabelKey, this.selectedCategory);
        } else if (newDefaultUserDescription && existingItem && existingItem.userDescription !== '') {
          // if the result of the fetchWikimediaDescriptionFromEndpoint has a new default description, use that
          this.state.itemDetails.userDescription = newDefaultUserDescription;
          // p.s. we don't need to write what has just come from the db!
          // #3
          // this.realtimeDbService.writeDescription(existingItem, this.selectedCategory, itemListLabelKey);
        } else {
          // #4
          if (this.state.itemDetails && existingItem) {
            // #4a this appears to be overwriting the description.
            this.state.itemDetails.userDescription = newDefaultUserDescription;
            // existingItem.userDescription = newDefaultUserDescription;
            // this.realtimeDbService.writeDescription(existingItem, itemListLabelKey, this.selectedCategory);
          } else {
            // backup to wikimedia description
            // this will most likely result in markup being put into the description,
            // so if this is really something we want, then it should be stripped.
            // this.state.itemDetails.userDescription = this.createDefaultDescription(
            //   this.state.wikimediaDescription,
            //   language
            // );
            // #4b
          }
        }
      })
      .catch(error => {
        log.error('error', error);
      });
  }

  /**
   * Remove occurrences of the label and aliases from the chosen default
   * item description.
   * Limit the string to n-characters.
   * Add ellipsis ...
   * @param description
   * @param language
   */
  createDefaultDescription(description: string, language: string) {
    const n = 100; // TODO: move this value into user preferences.
    const replacementChar = '*';
    description = description.toLocaleLowerCase();
    if (this.state.itemDetails.sitelinks[language + 'wiki']) {
      const label = this.state.itemDetails.sitelinks[language + 'wiki']['title'].toLowerCase();
      // remove label from the description
      if (label) {
        const newDescription = description.replace(label, replacementChar);
        description = newDescription;
      }
    }
    // remove aliases from the description.
    if (this.state.itemDetails.aliases) {
      const aliases = this.state.itemDetails.aliases[language];
      if (aliases) {
        aliases.forEach((item: any) => {
          if (description.indexOf(item.value) !== -1) {
            const newDescription = description.replace(item.value, replacementChar);
            description = newDescription;
          }
        });
      }
    }
    // add ellipsis ...
    description = description.length > n ? description.substr(0, n - 1) + '...' : description;
    return description;
  }

  getSPARQL() {
    const currentLanguage = this.i18nService.language;
    const sparqlLanguages = environment.sparqlLanguages;
    const sparqlLanguageObject = sparqlLanguages.find(i => i.appLanguage === currentLanguage);
    return sparqlLanguageObject;
  }
}
