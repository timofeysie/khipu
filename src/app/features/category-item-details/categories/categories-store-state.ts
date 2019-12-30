import { Category } from '@app/core/interfaces/categories';

const initCategories: Category[] = [];

export class CategoriesState {
  categories: Category[] = initCategories;
}
