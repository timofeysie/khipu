import { Category } from '@app/core/interfaces/categories';
import { Item } from '@app/core/interfaces/item';

const initCategories: Category[] = [];
const initItmes: Item[] = [];

export class CategoriesState {
  categories: Category[] = initCategories;
  wikidataItemList: Category[] = initCategories;
  wikiListItems: Item[] = initItmes;
}
