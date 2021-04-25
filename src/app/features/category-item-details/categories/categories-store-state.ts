import { Category } from '@app/core/interfaces/categories';
import { Item } from '@app/core/interfaces/item';

const initCategories: Category[] = [];
const initItems: Item[] = [];

export class CategoriesState {
  categories: Category[] = initCategories;
  wikidataItemList: Category[] = initCategories;
  wikiListItems: Item[] = initItems;
}
