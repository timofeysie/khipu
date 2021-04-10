import { Component, OnInit, Output, Input, AfterViewInit, ViewEncapsulation, EventEmitter } from '@angular/core';
import { ItemDetails } from '@app/core/interfaces/item-details';

@Component({
  selector: 'item-details',
  templateUrl: './item-details.component.html',
  styleUrls: ['./item-details.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ItemDetailsComponent implements OnInit, AfterViewInit {
  @Input() labelStr: string;
  @Input() itemDetails: ItemDetails;
  @Input() wikimediaDescription: any;
  @Input() wikipediaDescription: any;
  @Input() description: any;
  @Input() userDescription: string;
  @Input() language = 'en';
  @Output() descriptionUpdated = new EventEmitter<any>();
  wikimediaDescriptionToggle: boolean;
  constructor() {}

  ngOnInit() {}

  ngAfterViewInit() {}

  onDescriptionUpdated(event: any) {
    // for wikidata: this.itemDetails.labels[this.language]);
    // from the router param: labelStr
    this.descriptionUpdated.emit({ event: event, label: this.labelStr });
  }

  toggleDescription() {
    this.wikimediaDescriptionToggle = !this.wikimediaDescriptionToggle;
  }
}
