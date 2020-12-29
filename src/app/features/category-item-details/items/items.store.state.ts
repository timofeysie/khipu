import { Item } from '@app/core/interfaces/item';

const initItems: Item[] = [];

export class ItemsState {
  currentPage = 0;
  items: Item[] = initItems;
  selectedItem: Item;
}
