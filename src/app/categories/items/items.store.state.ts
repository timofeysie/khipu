export interface Item {
  categoryType?: string;
  name: string;
  type: string;
  uri: string;
}

const initItems: Item[] = [];

export class ItemsState {
  items: Item[] = initItems;
}
