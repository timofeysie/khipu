# Refactoring the item-details.store

This is the most ridiculous thing I have ever committed:

```ts
this.fetchWikimediaDescriptionFromEndpoint(label, 'en', label);
```

Since it is so difficult to figure out which one is which (quickly), they are doubled up for now to get the feature working before the big refactor. Don't judge!

The ItemDetailsStore class is a brittle string of functions passing each other too many arguments.

```ts
fetchDetails()
fetchDetailsFromEndpoint()
fetchDescription()
fetchWikimediaDescriptionFromEndpoint()
fetchFirebaseItemAndUpdate() or fetchDescriptionFromEndpoint()
```

fetchDetails() gets the route parameters and then, depending on if it's a Wikidata item or a Wikipedia item, it calls their respective functions to retrieve them from their endpoints.

These could be separate components, since they should be able to operated independatly. Before, we chained them together because we wanted to set the default user description based on whatever was the best choice after all the calls had been completed. This caused a pause for both components, so it's time to completely separate that functionality.

The refactoring of the item list store saw great benefits by separating the loading and parsing from the listing and editing phases.

Here, we can load the lists separately and the first idea to handle setting the default user description is to have a button when says something like "set Wikipedia description" or "set Wikipedia description". Or a button on each respective section that says "Set description as user description".

There are also some TypeScript suggestions on this:

```ts
this.activatedRoute.paramMap.subscribe(() => { ... }
```

The details:

```txt
@deprecated — Use an observer instead of a complete callback
@deprecated — Use an observer instead of an error callback
@deprecated — Use an observer instead of a complete callback
subscribe is deprecated: Use an observer instead of a complete callback (deprecation)tslint(1)
```

So that could also be taken care of now. Add it to the list.

## Planning the refactor

The ItemDetailsStore class is a brittle string of functions passing each other too many arguments.

```ts
fetchDetails()
fetchDetailsFromEndpoint()
fetchDescription()
fetchWikimediaDescriptionFromEndpoint()
fetchFirebaseItemAndUpdate() or fetchDescriptionFromEndpoint()
```

Likewise, the items.store is a sequential set of functions passing arguments to each other in a async chain that hides all its functionality and makes it hard to reason about. Here is the chain of command:

```ts
fetchList(category: Category, currentPage: number)
getItemsFromEndpoint(category, currentPage, existingItems)
getItemWithDescription(incomingItem, existingItems)
fetchWikilistFromEndpoint(category.name, 'en', '1')
```

Between these two classes, we now how a deep mess to dig ourselves out of. Below are some notes from the first attempt we made to plan our escape. I will start a new section at the bottom of that called "The Work Begins" to continue.

1. WikidataDescription (wikidata.org/wiki/Special:EntityData/qcode)
2. WikiMediaDescription (api/detail/id/lang/leaveCaseAlone)
3. WikipediaDescription (api/details/:lang/:title)
4. UserDescription (from firebase)

Instead of passing the result of each function on to the next one in a brittle chain of functions as noted above, lets isolate each function and return the result. Then we can compose the results and do what we need with them in the calling function. Sorry, that might not be the best description, so let's see the function names we want to create that are more descriptive.

fetchList(category: Category, currentPage: number) -> fetchListFromFirebase(category: Category)

Since the paginated current page argument is not needed to get all the items for a particular category kept in firebase, we can remove that. That value will be used later in the next call.

The new fetchListFromFirebase will return the whole list of items which has the following properties:

```json
  "metaData": {
    "item-details-viewed-count": 0,
    "item-details-viewed-date": 814,
    "user-description": "bias in which a person's subjective confidence in their judgements is reliably greater than the objective accuracy of those judgements",
    "user-description-viewed-count": 0
  }
```

We actually need an interface for that so we can strongly type the result. We are using TypeScript after all so should take full advantage of that and all it's benefits.

That class will look like this:

```ts
export interface ItemMetaData {
  itemDetailsViewedCount: number;
  itemDetailsViewedDate: number;
  userDescription: string;
  userDescriptionViewedCount: number;
}
```

The existing items result has a list of unique keys that have the body of that interface, like this:

```json
{
  "Ad iram": {
    "item-details-viewed-count": 0
    "item-details-viewed-date": 602
    "user-description": ""
    "user-description-viewed-count": 0
  },
  ...
}
```

The unique keys are kind of an interface killer, because we cant type a key like that. In fact, I'm not sure exactly how to type this kind of thing but I want to know the best way to do it. We want to put this as our return type, so the function signature should look like this:

```ts
fetchListFromFirebase(category: Category): ItemMetaData | any  { ... }
```

The second any part there is for the error. When we know what type of error firebase returns for this call, we can make an interface and type that also. For know, typescript is happy and we will continue sketching out the other functions before string them together and finding out how it actually performs.

The next function to refactor is this:

```ts
getItemsFromEndpoint(category: Category, currentPage: number, existingItems: any)
```

We wont need the existing items argument there anymore, as that was the result of the last function call. This will be kept in the calling function now. We also need a better name to signify the api it is calling. It looks like this: https://query.wikidata.org/sparql...

So lets change the name to include that:

```ts
getItemsFromWikidataEndpoint(category: Category, currentPage: number)
```

Next, we need some types for the result. But this is a huge function with sub-routines, so needs more thought first. What it does currently is:

1. fetch the list of a SPARQL call
2. map the results to an Item object
3. get a possible description for each item
4. if the list has changed we write the ItemsList
5. merge in the existing
6. if old objects exist we need to overwrite the API result meta-data with the previous version.
7. update the Items state

In essence, if it's the first time we visit this item detail, we need to check if we have a meta data object stored for that already in firebase, and if not, get a possible description for it and then save the new meta data with the new default user description.

The problem is, if we don't have a user-description, then we should wait until the other api calls come in to use one of those and then write the meta data object.

The root function that is going to use all these new functions by getting all their results and then deciding what to save back to firebase is going to make the business login going on here much more apparent.

The next function to refactor is getItemWithDescription(incomingItem, existingItems). Here we have been passing in the result from the last two functions, then deciding which description to use.

The existing items might have a user description.

- @param existingItems An entry from firebase with the user description and other metadata.
- @param needToSave we only save the results if anything has been

```ts
// check the existing items with the key in the incoming items and use that first,
// get the incoming item key
if (incomingItem[properties[0] + 'Label']) {
  incomingItemLabelKey = incomingItem[properties[0] + 'Label'].value;
}
if (existingItems && existingItems[incomingItemLabelKey]) {
  existingDescription = incomingItem[incomingItem[properties[1]].value];
  needToSave = true;
} else {
  existingItems = [];
  // otherwise use the incoming API description if there is one.
}
if (incomingItem[properties[0] + 'Description']) {
  incomingItemDescription = incomingItem[properties[0] + 'Description'].value;
  if (existingDescription && existingDescription.length > 0) {
}
descriptionToUse = existingDescription;
descriptionToUse = incomingItemDescription;
} else {
  const item: Item = {
}
  categoryType: properties[0],
  label: incomingItem[properties[1]].value,
  type: incomingItem[properties[1]].type,
  description: descriptionToUse,
  uri: incomingItem[properties[0]].value,
  binding: existingItems[incomingItemLabelKey],
  metaData: existingItems[incomingItem[properties[1]].value]
};
return { needToSave, item };
```

For "Converse accident", the incomingItemLabelKey = Q4892544, which will then get this incomingItem:

```json
fallacies: {type: "uri", value: "http://www.wikidata.org/entity/Q5106561"}
fallaciesLabel: {
  type: "literal"
  value: "fallacy of quoting out of context"
  xml:lang: "en"
}
```

Actually, this is what we chose. We need a better description of what that function is doing. Lets have a look at the end of the tunnel for a moment before detailing a run through the item.store.ts functions being refactored.

The fetchFirebaseItemAndUpdate() in the item-details-store.ts does the business logic to decide which description gets saved back to firebase, if any.

Come to thing of it, this class should be called item-details.store.ts as is the naming convention, so that will change now also. It's worth putting it here in its current _almost working_ state as it will be refactored soon hopefully.

```ts
fetchFirebaseItemAndUpdate(
  itemLabel: string,
  description: string,
  itemListLabelKey: string,
  newDefaultUserDescription?: string
) {
  this.realtimeDbService
    .readUserSubDataItem('items', itemLabel, itemListLabelKey)
    .then(existingItem => {
      if (newDefaultUserDescription && !existingItem && existingItem.userDescription !== '') {
        this.state.itemDetails.userDescription = newDefaultUserDescription;
        this.realtimeDbService.writeDescription(existingItem, itemLabel, itemListLabelKey);
      } else if (existingItem && existingItem.userDescription === '') {
        // pre-fill blank descriptions and save them back to the db
        const defaultDescription = this.createDefaultDescription(description);
        existingItem.userDescription = defaultDescription;
        this.state.itemDetails.userDescription = defaultDescription;
        this.realtimeDbService.writeDescription(existingItem, itemLabel, itemListLabelKey);
      } else {
        if (this.state.itemDetails && existingItem) {
          // this appears to be overwriting the description.
          this.state.itemDetails.userDescription = newDefaultUserDescription;
          existingItem.userDescription = newDefaultUserDescription;
          this.realtimeDbService.writeDescription(existingItem, itemLabel, itemListLabelKey);
        } else {
          this.state.itemDetails.userDescription = this.createDefaultDescription(this.state.wikimediaDescription);
        }
      }
```

Writing the description in the else { if this.state.itemDetails && existingItem ...} works to fix the brokeness since the last time we deployed to firebase and started the refactor. It's worth a commit here to mark the progress.

The last thing that needs to be fixed before we continue with this refactor is that the Wikipedia description is showing up as a truncated version of the Wikimedia description, which it shouldn't do. The form is getting pre-filled also with that value, which we do want, so then we just have to complete the update if a user edits the field.

Another bug at the moment is that the first time the user visits the detail that has no description, the wiki description is not being added to the input field. If the description is then added back to the firebase meta data user-description field, then the next time you visit the details page, the field is pre-filled with that user-description. So with the exception of those to issues and the refactor of the functions in items.store and item-details.store, we are only a month in on the [Get the description of a detail page and add it as the item list description](https://github.com/timofeysie/khipu/issues/25) issue #25 which was closed 20 days ago. Why was it closed. This is all part of that _simple_ feature. Work began on it at the beginning of the Christmas break 2020. Actually, #25 was created Nov 19. In order to respect what has gone into this feature since then, these issues have been closed:

- A details page with descriptions is not always added to the item list page descriptions
- Cannot read property 'uid' of null
- New categories need a name field.
- Create CRUD functions for the firebase realtime db
- Setup firebase auth integration
- Add description edit form

The firebase auth and integration was the big part. The description form is almost ready. After the two issues above, and the refactor, there is still more to do. Here is currently what is on the plate:

- Refactor the item.store service calls #38
- appeal to common sense is an aka of Argument from incredulity #37
- property 'value' of undefined at SafeSubscriber.\_next (item-details-store.ts:46) #36
- Remove label text from default user descriptions and add tooltip with explanation #35
- When using the description as a question user should be warned if it contains part of the item label #34
- Create a backup plan for items with no link #29
- Add selected item to the store

Then, we can think about exporting a category as a lesson plan or test with a cmi5 format.

Those issues to do are:

1. the Wikipedia description is showing up as a truncated version of the Wikimedia description
2. the first time the user visits the detail that has no description, the wiki description is not being added to the input field.

The problem with #1 is that wikimediaDescription has the right name, but wikipedia description is showing the description. This was due to some naming confusion during the attempted refactor. As any programmer knows, naming is difficult. Here we have overuse of the word "description" and it's been tough to separate them out.

What is the api call for the wikipedia details page? It could also be that the wikimedia description is getting mixed in there also. Wikipedia is the website, wikimedia is the content and querying of it that goes into the website. Wikidata is some of that content that is organized into lists and other connections.

These are the two functions:

getWikipediaDescription()

getWikimediaDescription()

I'm still seeing userDescription as a member of the firebase meta data response. If I look at the firebase console, I can only see the snake-case version "user-description".

Wikipedia, which is the problem does this call:

Request URL: https://www.wikidata.org/wiki/Special:EntityData/Q16948492.json

Request Method: GET

```json
...
descriptions: {
  en: {
    language: "en"
    value: "propensity for humans to favor suggestions from automated decision-making systems and to ignore contradictory information made without automation"
    id: "Q16948492"
  },
  labels: { ...
}
```

The description is there, but not making it into the template, or is being replaced by the user-description. I don't know when it started, but the state was being set directly in the item.details.store. Darn, should have used Redux after all. We should just be dispatching an action to update the state, not this whatever goes. Just having a state doesn't mean we have to use it properly.

We still have a naming issue, but this fix is worth a commit.

```ts
const initItemDetails: ItemDetails = {
  descriptions: {},
  ...
  userDescription: ''
};
export class ItemDetailsState {
  itemDetails: ItemDetails = initItemDetails;
  description: any;
  wikimediaDescription: any;
  wikipediaDescription: any;
}
```

That's fine, like a room on fire, so we can move on to getting the user description into the form.

```html
<app-description-form [userDescription]="itemDetails.userDescription" ...
```

To write a new description, we need this:

this.realtimeDbService.writeDescription(existingItem, itemLabel, itemListLabelKey);

fetchFirebaseItemAndUpdate(
itemLabel: string,
description: string,
itemListLabelKey: string,
newDefaultUserDescription?: string
) {
this.realtimeDbService
.readUserSubDataItem('items', itemLabel, itemListLabelKey)

this.selectedCategory = params.get('selectedCategory');

It's ridiculous to pass around a member variable like this.selectedCategory. But, if the calling function is not sure it has been set yet, then, I supposed it's a little OK. This is a good example of why functional programming is a good idea. Arguments go in, results come out. There is no altering the state inside a function. If a variable has to be used in a template, it should be possibly different from the way it is set, and named differently from the argument passed into a function. Wish we were using React for this project.

I just thought now that the idea that a detail page can be shared and work the way we want it to work is not really a good idea. If we don't know the category, how are we going to take the detail code and figure out which category it's in? It could be in multiple categories, so really, there is no way to be able to store the new description?

Or maybe it's OK just to add a detail with a new description to items without a category? I don't know. Will have to think about this. For now, if the category is not there, we are not going to be saving it.

To save the description, we need to establish the exact path to the description, which requires only two things:

items/_user-id_/category/_detail-name_/user-description

items/X0YFaM8hXHdm89FWEQsj0Aqhcln1/cognitive_bias/Automation bias/user-description

writeDescription(detail: any, itemLabel: string, category: string) {

const pathToData = 'items/' + userId + '/' + itemLabel + '/' + category;

There is also the content to write, which is the new user description. But the two at the end of the path are switched. It should be category/label

Updating the description goes like this:

item-details.component.ts:26
item-details-container.component.ts:46
items.store.ts:29

We can write the description, but the wikidata description is being used instead of the new one.

1. if you delete a meta data object for an item on firebase, when you get the category list again, that one is not added to the list.

2. the first time the user visits the detail that has no description, the user description is not being added to the input field.

3. the user-description updated by the form does not show up in the list.

Number 1 is kind of a different direction from the description epic underway, so we can do that later. We shouldn't really be deleting items outside the app, and that functionality hasn't really been tested or supported so I'm not surprised it's an issue now. We did discuss that as a potential pitfall when we started storing paginated views of the categories list.

Number 3 is a regression, as the currently deployed app does not have this issue. It looks like realtimeDbService.readUserSubData('items', category.name) is failing. And guess why? The user id is undefined. What gives with this error? All the functions that use the db were converted to use the version that returns the id. So the id is definitely an asynchronous thing.

There is still some trouble with the user id, which is asynchronous, but so are the other functions that call them. Putting the user id into the constructor has helped a bit, but will still fail the first time.

Also, we were not checking for the user-description properly in the template, so even though they were there, we weren't seeing them in the ui because the arrow character was not there indicating that am existing user-description had been found.

As a short term fix to get things working, a Promise was used in the realtimeDbService.readUserSubDataItem function. When you refresh the details page, the problem with the user id being undefined breaks getting the user description, so it is empty the first time the user goes to that page.

An RxJs solution would be better, but since at this point we are still considering our options for the architecture here, a Promise is a straight forward short term solution so that we can get everything working before the big refactor. The problem with refactoring a broken solution is that you don't know if what you did is working or not, or if you have just introduced a new difficult to diagnose bug.

So fix [the problems with the description](https://github.com/timofeysie/khipu/issues), then refactor using incremental development from a position of a working app is the way to go. Don't judge me for reaching for the Promise, please.

After a bit of work, things have improved slightly. The proper item list user-description shows up in the text area ready to edit in the details page. There are still a few issues however:

1. the wikidata description shows up for a brief moment and then is replaced by the proper user-description.
2. the fallacy "if-by-whisky" shows up with the wikidata description, and then flashes to the automatically created default description with the label removed. There actually is a saved user-description for this item, so where is that?

## Old getting started notes

_Note this used to be at the top of the file when it was written inside of the refactoring-item-store.md file._

After planning this months ago, it's finally happening for the item-details.store. First a "list of" Wikipedia page was parsed for a list of items in the add-category feature. This list was then merged with the former Wikidata list of items, and the user can then start to edit the list on the item.

This means editing the user description, and having that user description then appear on the category list. This was difficult before, but now we have that available in the firebase db, it's a matter of CRUD functions.

We still have to deal with removing the label from the item. There is plenty of that going on in the Wikipedia content, so this class needs to do as much as it can to get rid of stuff that's not appropriate for a label/description pair that can be reversed and used for automatic test generation purposes.

Currently, some things are working such as the ad hominem item in the fallacies category. Others don't. Either way, right now, there is this error:

```txt
zone.js:3372 GET https://www.wikidata.org/wiki/Special:EntityData/q.json 400
scheduleTask @ zone.js:3372
push../node_modules/zone.js/dist/zone.js.ZoneDelegate.scheduleTask @ zone.js:410
onScheduleTask @ zone.js:301
...
Show 170 more frames
logger.service.ts:107 [ErrorHandlerInterceptor] Request error HttpErrorResponse {headers: HttpHeaders, status: 400, statusText: "OK", url: "https://www.wikidata.org/wiki/Special:EntityData/q.json", ok: false, …}
...
[HttpCacheService] Cache set for key: "https://radiant-springs-38893.herokuapp.com/api/details/en/[object Object]"
```

The title of the page is also [object Object]

That's a big hint there.

Moving on, itemDetails.aliases don't exist in Wikipedia parsed items. Actually they might, but would require extra specific parsing which we don't need more of at the moment.

An example of a working Wikipedia-parsed item is:

```json
description: " attacking the arguer instead of the argument. (Note that "ad hominem" can also refer to the dialectical strategy of arguing on the basis of the opponent's own commitments. This type of ad hominem is not a fallacy.)↵"
label: "Ad hominem"
uri: "/wiki/Ad_hominem"
wikidataUri: undefined
```

This represents the simplest approach that covers both sources. The old item details that were created from the Wikidata items which we expected to combine with Wikipedia parsed items is this:

```ts
export interface ItemDetails {
  aliases: any;
  claims: any;
  descriptions: any;
  id: string;
  labels: any;
  lastrevid: number;
  modified: string;
  ns: number;
  pageid: number;
  sitelinks: any;
  title: string;
  type: string;
  userDescription?: string;
}
```

But now we need to adjust the details page to accept just the basics and not error out if something is missing.

Commit message: closes #46 #48 #38 added uri and wikidataUri to item-meta-data, path for wikipedia-parsed items and updating the item details wip

Issues involved:

- Load only the firebase list on the items list page #48 opened 16 days ago by timofeysie Refactor items.store

- Include links to the detail pages to the meta data stored in firebase #46 opened 20 days ago by timofeysie Refactor items.store

- Refactor the item.store service calls enhancement #38 opened on Jan 23 by timofeysie Refactor items.store

OK, what's next?

1. Issue #35: Remove label text from default user descriptions and add tooltip with explanation
2. Fix all console errors.
3. The items list does not work on refresh.

We're going to go without the tooltip function for now. The simplest approach for the mvp can work without that. All nice to have features are on hold for now. Anyhow, that's enough work before the next commit.

Let's start with #2.

```txt
GET https://www.wikidata.org/wiki/Special:EntityData/q.json 400
```

This happens on the details page.

The title for Accident\_(fallacy) is only "accident" which results in getting the wrong details page.

Here is what we are getting from firebase:

```json
item-details-viewed-count: 0
item-details-viewed-date: 1615885028509
uri: "/wiki/Accident_(fallacy)"
user-description: " an exception to a generalization is ignored.↵"
user-description-viewed-count: 0
wikidataUri: ""
```

My guess is that the label is changed when adding the category.

But no, it's not. The label is simply "Accident".

That uri actually works.

categoryForm = new FormGroup({
categoryName: new FormControl('fallacies'),
label: new FormControl('Fallacies'),
language: new FormControl('en'),
wdt: new FormControl('P31'),
wd: new FormControl('Q186150')
});

label: "Fallacies"
language: "en"
name: "fallacies"
wd: "Q186150"
wdt: "P31"
