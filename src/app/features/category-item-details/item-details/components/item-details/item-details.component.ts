import { Component, OnInit, Input, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ItemDetails } from '@app/core/interfaces/item-details';

@Component({
  selector: 'item-details',
  templateUrl: './item-details.component.html',
  styleUrls: ['./item-details.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ItemDetailsComponent implements OnInit, AfterViewInit {
  @Input() itemDetails: ItemDetails;
  @Input() wikimediaDescription: any;
  @Input() description: any;
  @Input() language = 'en';

  constructor() {}

  ngOnInit() {}

  ngAfterViewInit() {}

  descriptionUpdated(event: any) {
    console.log('descriptionUpdated', event);
  }
}
