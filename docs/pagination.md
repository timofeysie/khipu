## Pagination

With regarding the pagination with displaying items list, the results from the API can be received with a `limit` and an `offset`. SPARQL provodes `limit` parameter to determine number of rows and `offset` parameter determines which page should be returned when the query is executing with the `limit` over the total number of rows in the resulting response.

```sql
 SELECT ?${category.name} ?${category.name}Label ?${category.name}Description WHERE {
                    SERVICE wikibase:label {
                        bd:serviceParam wikibase:language "[AUTO_LANGUAGE],${category.language}".
                    }
                    ?${category.name} wdt:${category.wdt} wd:${category.wd}.
    }
    ORDER BY (LCASE(?label))
    LIMIT ${numberOfRowsPerPage}
    OFFSET ${currentPage}`;
```

[ItemsListEndpoint](https://github.com/timofeysie/khipu/blob/dev/src/app/features/category-item-details/items/items.endpoint.ts 'ItemsListEndpoint') service, executes the query and returns the response with the `limit` and `offset` values.

`listItems (category: Category, currentPage: number): Observable <any>`

To hold the current page in the items state, a property `currentPage = 0` is there in the [ItemsState](https://github.com/timofeysie/khipu/blob/dev/src/app/features/category-item-details/items/items.store.state.ts 'ItemsState') class.

```
export class ItemsState {
  currentPage: number = 0;
  items: Item[] = initItems;
}
```

The [ItemsStore](https://github.com/timofeysie/khipu/blob/dev/src/app/features/category-item-details/items/items.store.ts 'ItemsStore') consumes [ItemsListEndpoint](https://github.com/timofeysie/khipu/blob/dev/src/app/features/category-item-details/items/items.endpoint.ts 'ItemsListEndpoint') service, by a public method
`fetchList (category: Category, currentPage: number)` which exposed to the [ItemsContainerComponent](https://github.com/timofeysie/khipu/blob/dev/src/app/features/category-item-details/items/container/items-container.component.ts 'ItemsContainerComponent'). The `fetchList` method gets an observable from the [ItemsListEndpoint](https://github.com/timofeysie/khipu/blob/dev/src/app/features/category-item-details/items/items.endpoint.ts 'ItemsListEndpoint')

```javascript
fetchList(category: Category, currentPage: number) {
  console.log(currentPage);
  this.itemListEndpoint
    .listItems(category, currentPage)
    .pipe(
      map(inc => {
        let list: Item[] = [];
        list = inc.map((incomingItem: any) => {
          const properties = Object.keys(incomingItem);
          const item: Item = {
            categoryType: properties[0],
            label: incomingItem[properties[1]].value,
            description: incomingItem[properties[0] + 'Description']
              ? incomingItem[properties[0] + 'Description'].value
              : '',
            type: incomingItem[properties[1]].type,
            uri: incomingItem[properties[0]].value
          };
          return item;
        });
        return list;
      })
    )
    .subscribe((items: Item[]) => {
      this.updateItemsState(items, currentPage);
    });
}store.fetchList
```

On the subscription, (line 24) accepts new Items list and then passed into `updateItemsState` method with the current page.

    updateItemsState(items: Item[], currentPage: number) {
        this.setState({
          ...this.state,
          items,
          currentPage
        });
      }

At line 3,4 replace the items in the state with new items list and at line 5, set the new current page to the state. Once the state is changed, the container view changes with the new Items list.

When the user clicks on navigation buttons from the items container, it executes `store.fetchList` method with the current page offset parameter. So for next page,

`store.fetchList(category, store.state.currentPage + 1)`

and for back to previous page,

`store.fetchList(category, store.state.currentPage - 1)`.

At the initial state, the `currentPage` is 0 by default, when the pagination buttons working, same initial method is calling with different `currentPage` values.
