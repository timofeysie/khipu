import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@app/store';
import { ItemDetailsState } from './item-details-store-state';
import { ItemDetailsEndpoint } from './item-details.endpoint';
import { ItemDetails } from '@app/core/interfaces/item-details';
import { map } from 'rxjs/operators';
import { I18nService } from '@app/core';
import { environment } from '@env/environment.prod';

@Injectable()
export class ItemDetailsStore extends Store<ItemDetailsState> {
  constructor(
    private itemDetailsEndpoint: ItemDetailsEndpoint,
    private i18nService: I18nService,
    private router: Router,
    private activatedRoute: ActivatedRoute
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

  fetchDetailsFromEndpoint(qcode: string, language: string) {
    this.itemDetailsEndpoint
      .fetchDetails(qcode, language)
      .pipe(
        map((rawItemDetailsList: ItemDetails[]) => {
          const lst: ItemDetails[] = rawItemDetailsList.map(rawItemDetails => {
            const itemDetails: ItemDetails = { ...rawItemDetails, language: language };
            return itemDetails;
          });
          return lst;
        })
      )
      .subscribe((itemDetailsFromEndpoint: ItemDetails[]) => {
        this.state.itemDetails = itemDetailsFromEndpoint;
      });
  }

  saveNewItemDetails(newItemDetails: ItemDetails) {
    this.setState({ ...this.state, itemDetails: [newItemDetails] });
    this.itemDetailsEndpoint.addItemDetails(newItemDetails);
  }
}
