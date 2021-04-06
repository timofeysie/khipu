# Refactor the item.store service calls

These notes here help discuss refactoring ideas a problems involved. They probably wont be much fun to read in the future, but are here for now to help get the work done.

## The Work Begins

The work had begun a bit, but there was still some bugs to work out before continuing to make sure we were starting from a working position.

Here is the "god function" which will call all the other functions and collect the results and handle all the asynchronous actions needed in one place.

```ts
  doWork(category: Category, currentPage: number) {
    const listFromFirebaseCategory = this.fetchListFromFirebase(category);
    const wikidataItemList = this.getItemsFromWikidataEndpoint(category, currentPage);
  }
```

To keep track of what the changes going on, we will keep the old functionality and create new version of the functions which return their result to the god function.

```ts
fetchList -> fetchListFromFirebase
getItemsFromEndpoint -> getItemsFromWikidataEndpoint
fetchWikilistFromEndpoint -> getWikilistFromEndpoint
```

Now, the last one on our list there, getItemsFromWikidataEndpoint just returns the items. It used to do this inside:

```ts
list = inc.map((incomingItem: any) => {
  const results = this.getItemWithDescription(incomingItem, existingItems);
  listChanged = results.needToSave;
  return results.item;
});
if (listChanged) {
  this.realtimeDbService.writeItemsList(list, category.name);
}
```

You can see we added a flag "needToSave" there, which is a big smell.

Next, we added this functionality just for the fun of it:

```ts
this.fetchWikilistFromEndpoint(category.name, 'en', '1');
```

The wikilist is part of another epic to parse wikipedia pages with lists and create our own lists of items similar to a wikidata item. I wont go into that here, but that work will continue after we clean up this class and implement an ordering for the list.

The new function will just make the call and return the result. The new god function will be responsible to handling this logic:

```ts
const markup = response['parse']['text']['*'];
if (_title === 'fallacies') {
  wikiList = this.getItemsFromFallaciesList(markup);
  const newList = this.tempItems.concat(wikiList);
  this.updateItemsState(newList, this.currentPage);
} else if (_title === 'cognitive_bias') {
  this.getItemsFromCognitiveBiasesList(markup);
}
```

After a bit of work, the god function looks like this:

```ts
doWork(category: Category, currentPage: number) {
  const listFromFirebaseCategory = this.fetchListFromFirebase(category);
  const wikidataItemList = this.getItemsFromWikidataEndpoint(category, currentPage);
  const wikiDataList = this.mapItemsFromWikidata(wikidataItemList, listFromFirebaseCategory, category);
  const wikiListResponse = this.getWikilistFromEndpoint(category.name, 'en', '1');
  const wikiListItems = this.parseParticularCategoryTypes(wikiListResponse, category.name, 'en', '1');
  const newList = wikiDataList.concat(wikiListItems);
  this.updateItemsState(newList, this.currentPage);
  this.realtimeDbService.writeItemsList(newList, category.name);
  // do we delete items that are not there?
}
```

In this way we end up with a list which naturally (somewhat) describes what the file does.

1. fetch List From Firebase
2. get Items From Wikidata Endpoint
3. map Items From Wikidata
4. get Wikilist From Endpoint
5. parse Particular Category Types
6. concat
7. update Items State
8. write Items List

We can already see some naming inconsistencies here. We don't need both fetch and get referring to the same kind of action. One is a cloud database call, the other is an http get.

But this is only the order. We need to think about the async calls. We don't want to create a chain that waits for each step. We want all the calls to go at once, and then as we can apply the business logic, update the UI whenever each part finishes. At least that's the idea right now.

Firebase items can be displayed immediately.
Then we should see if we want to get the wikidata or wikipedia content. A bit more than just refactoring, it's actually a bit weak to rely on caching to justify getting all the data each time. In the least, we want a configurable way to check for updates. The first time we get the category, that might actually be enough. Would it be too much to have a "create category" list, and then a static list that is malleable to updates and changes.

At least that's one option. Another option, as we have currently is to just treat new and old situations the same. We really need to find a way to check if any of the content has changed in the list via an api call. Who wants to handle that?

### The async approach

Introducing async/await as a basic way to get the result of one argument into another is one way to go. It's not ideal as we want all the async calls to be done in parallel, but it's a good first step to see if our new functions are working.

```ts
async fetchListFromFirebase(category: Category): Observable<ItemMetaData> {
```

Gives this error:

Type 'typeof Observable' is not a valid async function return type in ES5/ES3 because it does not refer to a Promise-compatible constructor value.
Types of construct signatures are incompatible.
Type 'new <T>(subscribe?: (this: Observable<T>, subscriber: Subscriber<T>) => TeardownLogic) => Observable<T>' is not assignable to type 'new <T>(executor: (resolve: (value: T | PromiseLike<T>) => void

It works with Promise instead of Observable. Will move on for now and debug the errors in the functions, like this:

Error: Uncaught (in promise): TypeError: inc.map is not a function
TypeError: inc.map is not a function
at ItemsStore.<anonymous> (items.store.ts:57)

The result of getItemsFromWikidataEndpoint needs to be an array, not an Observable. But actually we ant an observable array. Yay!

Another error coming out of the categories page now is this:

```txt
[CategoriesStore] error fetching list TypeError: Cannot convert undefined or null to object
    at Function.keys (<anonymous>)
    at categories-store.ts:29
```

Oh, life, wehsy up wit ya?>

So, yeah, we need to subscribe to the observable, as we all know. As Trump likes to say, everybody knows.

For the observables that we want to have happen at the same time, we can use fork join. But there is a some tricky timing here that we need to get very clear about in order to create a kind of pattern that can work for whatever architecture it is written in, be it React, Angular, Vue, or vanilla or even Node.

getItemsFromWikidataEndpoint and getWikilistFromEndpoint can both happen with fork join I think.

But forkJoin is deprecated:

(alias) forkJoin<any, string>(v1: ObservableInput<any>, v2: ObservableInput<string>): Observable<[any, string]> (+16 overloads)
import forkJoin
@deprecated — Use the version that takes an array of Observables instead

Something like this was what I tried:

```ts
forkJoin(
  this.getItemsFromWikidataEndpoint(category, currentPage),
  this.getWikilistFromEndpoint(category.name, 'en', '1')
).pipe(
  map(([wikidataItemList, wikiListResponse]) => {
    const wikiDataList = this.mapItemsFromWikidata(
      wikidataItemList,
      listFromFirebaseCategory,
      category
    );
    const wikiListItems = this.parseParticularCategoryTypes(
      wikiListResponse,
      category.name,
      'en',
      '1'
    );
    const newList = wikiDataList.concat(wikiListItems);
    this.updateItemsState(newList, this.currentPage);
    this.realtimeDbService.writeItemsList(newList, category.name);
    // do we delete items that are not there?
  })
);
```

'(v1: ObservableInput<any>, v2: ObservableInput<string>): Observable<[any, string]>' is deprecatedts(6385)
forkJoin is deprecated: Use the version that takes an array of Observables instead (deprecation)tslint(1)

Just to keep things clear, the nested approach started off like this:

```ts
const listFromFirebaseCategory = await this.fetchListFromFirebase(category);
this.getItemsFromWikidataEndpoint(category, currentPage).subscribe(
  wikidataItemList => {
    const wikiDataList = await this.mapItemsFromWikidata(
      wikidataItemList,
      listFromFirebaseCategory,
      category
    );
    const wikiListResponse = await this.getWikilistFromEndpoint(
      category.name,
      'en',
      '1'
    );
    const wikiListItems = await this.parseParticularCategoryTypes(
      wikiListResponse,
      category.name,
      'en',
      '1'
    );
    const newList = wikiDataList.concat(wikiListItems);
    this.updateItemsState(newList, this.currentPage);
    this.realtimeDbService.writeItemsList(newList, category.name);
    // do we delete items that are not there?
  }
);
```

The next version, despite the deprecated fork join is:

```ts
  async doWork(category: Category, currentPage: number) {
    const listFromFirebaseCategory = await this.fetchListFromFirebase(category);
    forkJoin(
      this.getItemsFromWikidataEndpoint(category, currentPage),
      this.getWikilistFromEndpoint(category.name, 'en', '1')
    )
      .pipe(
        map(async ([wikidataItemList, wikiListResponse]) => {
          const wikiDataList = await this.mapItemsFromWikidata(wikidataItemList, listFromFirebaseCategory, category);
          const wikiListItems = await this.parseParticularCategoryTypes(wikiListResponse, category.name, 'en', '1');
          const newList = wikiDataList.concat(wikiListItems);
          this.updateItemsState(newList, this.currentPage);
          // this.realtimeDbService.writeItemsList(newList, category.name);
          // do we delete items that are not there?
          return newList;
        })
      )
      .subscribe(result => {
        // result ZoneAwarePromise
      });
  }
```

This function is now as effective as the previous version. It's a step in the right direction, but far from perfect.

Obviously, the result there is not what we want:

```txt
ZoneAwarePromise {__zone_symbol__state: null, __zone_symbol__value: Array(0)}
Symbol(Symbol.toStringTag): (...)
```

We are skipping the write there, and there is still no order to the list, and the extra items are just merged with the paginated views on each page.

The ordering should be done and then the paginated views updated to use that ordering. That's up next.

So far this month, GitHub shows these stats:

```txt
timofeysie/khipu 9 commits
timofeysie/curator 3 commits
timofeysie/conchifolia 1 commit
```

There has been some additional scope added to this issue. It relates to parsing Wikipedia for content and adding that functionality to the add category page, not the item list as originally planned. We will be separating the first time creating a list from the simple retrieval of the firebase list. There will now be the load/edit mode and the list mode.

Here are the issues raised for this. It's kind of become it's own epic, or has hijacked other epics, not sure.

- Issue #45 Move list loading features from items.store to the add category page
- Issue #42 Add an order to the list
- Issue #44 parse the wiki-list api results for items
- Issue #38 Refactor the item.store service calls enhancement
- Issue #6 Merge the two lists

Once we have the list creation functionality moved to the add category page, we need to remove it from the item.store.

We will need to expand the meta data stored in firebase to include links to the detail pages so that the list page will still be able to route to a detail page when a user chooses an item.

Basically, we want to offer the same edit functions even if the firebase backup is not there. This means separating the firebase functionality from everything. A guest user could also use this feature to create one-off lesson plan and have no need to update it themselves as their school LRS would manage that later.

This is all good stuff.

Next, enable links on the temporary items list, and paginate the wikipedia objects to add different ones to each page.

Enable routing to the details page from the add categories page.
Disable load without a warning that the current list will be list. Could have a refresh button to do this. Load might only be enabled when the data in the form is changed. Currently it will be helpful to change the category and see the number of results from each in an interactive way.

If it was as simple as adding https://en.wikipedia.org/ to the uri parsed, then that would be great:

```python
description: "a statement that takes something for granted because it would probably be the case (or might be the case)."
label: "Appeal to probability"
sectionTitle: "Formal fallacies"
sectionTitleTag: "H2"
uri: "/wiki/Appeal_to_probability"
```

The problem is we route to our details page like this:

```ts
this.router.navigate([
  `/categories/item-details/${this.categoryName}/${qCode}`
]);
```

As you can see, we don't have the qr code. And in fact we don't need it. All we need it the uri fragment. So we need another route in the router to provide that, and more functionality on the details page to deal with the snake case name only.

## Removing old code

During the refactoring process it was decided to move all the list creating functionality from items.store into the add-categories.store. Now, we can really tighten up items.store and give it the single responsibility of loading the firebase list.

At least that's the idea. The new model then will break the existing state and view, so there is actually a bit more involved.

Or, the result from the firebase call can be converted into objects. More object mapping. I thought one of the reasons the realtime db was chosen is because it operates on json?

Really, the firebase data should be in the same format as it will be consumed in the front end to simplify the whole process. That's another thing to refactor.

For now, just map it and plan for the refactor. The example code for the db all showed snake case for the property keys, so maybe they have a good explanation for that.

Then, the details page is broken. For Wikipedia items, there is no q-code. We have a relative url that can be used to get a details page, but then it will need to be parsed. The detail page url also needs to get the label so that it can look up the details of the item.

Then, it's time to actually refactor the item-details.store. It's a mess and broken now that it's not just getting Wikidata items, but also those created by parsing a Wikipedia "list of" page. That will be a section above this so one doesn't have to scroll so much to get writing.
