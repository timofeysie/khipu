import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// import { categoriesList } from '@env/environment';
import { finalize } from 'rxjs/operators';
import { CategoryItemDetailsService } from '../../../category-item-details.service';
import { ItemDetailsStore } from '../../item-details-store';

@Component({
  selector: 'app-categories',
  templateUrl: './item-details-container.component.html',
  styleUrls: ['./item-details-container.component.scss'],
  providers: [ItemDetailsStore]
})
export class ItemDetailsContainerComponent implements OnInit {
  isLoading = false;
  label: string;
  siteLink: string;
  constructor(
    public store: ItemDetailsStore,
    private categoryItemDetailsService: CategoryItemDetailsService,
    private activatedRoute: ActivatedRoute
  ) {
    console.log('constructed');
  }

  ngOnInit() {
    // this.store.fetchList();
    this.activatedRoute.paramMap.subscribe(params => {
      console.log('qcodeer', params.get('qcode'));
      this.getSomething(params.get('qcode'));
    });
    console.log(' this.store', this.store);
  }

  getSomething(_qcode: string) {
    this.categoryItemDetailsService
      .getItemDetails({ qcode: _qcode })
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((details: string) => {
        console.log('details', details);
        this.label = details['entities'][_qcode]['labels']['en'];
        this.siteLink = details['entities'][_qcode]['sitelinks']['enwiki'];
        console.log('k===', this.label);
      });
  }
}
