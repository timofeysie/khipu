import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
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
  constructor(
    public store: ItemDetailsStore,
    private categoryItemDetailsService: CategoryItemDetailsService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    // this.store.fetchList();
    // this.activatedRoute.paramMap.subscribe(params => {
    //   this.getSomething(params.get('qcode'));
    // });
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
        this.label = details['entities'][_qcode]['labels']['en'];
        this.siteLink = details['entities'][_qcode]['sitelinks']['enwiki'];
        if (details['entities']['Q295150']) {
          console.log("details['entities']", details['entities']);
          this.aliases = details['entities']['Q295150']['aliases']['en'];
        }
      });
  }
}
