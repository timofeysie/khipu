export interface Item {
  categoryType?: string;
  label: string;
  description: string;
  type: string;
  uri: string;
}

const initItems: Item[] = [];

export class ItemsState {
  currentPage = 0;
  items: Item[] = initItems;
  selectedItem: Item;
}
