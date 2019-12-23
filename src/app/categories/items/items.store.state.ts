export interface Item {
  id: number;
  name: string;
}

const initItems: Item[] = [
  { id: 1, name: 'item -1' },
  { id: 2, name: 'item -2' },
  { id: 3, name: 'item -3' }
];

export class ItemsState {
  items: Item[] = initItems;
}
