import { Component, OnInit, Input } from '@angular/core';
import { ItemDetails } from '@app/core/interfaces/item-details';

@Component({
  selector: 'item-details',
  templateUrl: './item-details.component.html',
  styleUrls: ['./item-details.component.scss']
})
export class ItemDetailsComponent implements OnInit {
  @Input() itemDetails: ItemDetails;
  @Input() language = 'en';

  constructor() {}

  ngOnInit() {}
}
