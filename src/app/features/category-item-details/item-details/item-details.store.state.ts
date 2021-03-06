import { ItemDetails } from '@app/core/interfaces/item-details';

const initItemDetails: ItemDetails = {
  aliases: {},
  claims: {},
  descriptions: {},
  id: '',
  labels: {},
  lastrevid: 0,
  modified: '',
  ns: 0,
  pageid: 0,
  sitelinks: {},
  title: '',
  type: '',
  userDescription: ''
};

export class ItemDetailsState {
  itemDetails: ItemDetails = initItemDetails;
  description: any;
  wikimediaDescription: any;
  wikipediaDescription: any;
}
