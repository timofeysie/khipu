# Sprint 2

Start date: April 3rd, 2021.
End date: April 30th, 2021.

Sprint planning: scope of sprint, all issues story-pointed, set a sprint target name.

Target: fix all the bugs from the last two sprints,

Here is the list of to do items for this sprint.

1. Non-adaptive choice switching uri
2. Cannot read property 'includes' of null
3. DONE - detail pages lead to general description, not a detail
4. DONE - what to do with the rejected items info
5. DONE - #58 fallacies end of list function not working regression
6. Cannot convert undefined or null to object
7. DONE - Cannot read property 'q' of undefined
8. DONE - #47 fix the icons
9. DONE - #55 Create link to Wikipedia on the details page
10. Redirect to data uri value response error (Issue #57)
11. Refactor the item-details-store and friends
12. Use an observer instead of a complete callback for the router params
13. Cannot read property 'en' of undefined on user description update
14. #54 Allow links on detail pages to work
15. DONE - Start using GitHub projects

## Work notes

It's time to raise issues for the items here that have not been fixed. It's no fun scrolling up and down this page trying to figure out the status of each.

### #1 The item "Non-adaptive choice switching" is still an issue for the uri

Steps to reproduce?

It looks like this;
uri: "#cite_note-75"

### #2 cannot read property 'includes' of null

Is this the same as the above? The error is the same.

```txt
core.js:4002 ERROR Error: Uncaught (in promise): TypeError: Cannot read property 'includes' of null
TypeError: Cannot read property 'includes' of null
    at CategoriesStore.push../src/app/features/category-item-details/categories/categories-store.ts.CategoriesStore.logParsing (categories-store.ts:350)
```

I think a check for null was added before line 350 to address this, so leave it for now. If this happens again the steps to reproduce should be captured and an issue raised.

### #3 detail pages lead to general description, not a detail

For example: Actor-observer bias
The detail page shows the definition of a cognitive bias.

redirects: [{from: "Actor-observer bias", to: "Actor–observer asymmetry"}]
0: {from: "Actor-observer bias", to: "Actor–observer asymmetry"}
from: "Actor-observer bias"
to: "Actor–observer asymmetry"

It looks like the same call is being made twice. The second time with the category instead of the label.

```txt
item-details-store.ts:117 _title, sparqlLanguageObject.sparqlLanguage, setDefaultDescription Actor-observer bias en true
...
item-details-store.ts:117 _title, sparqlLanguageObject.sparqlLanguage, setDefaultDescription cognitive_biases en true
```

Looking at the ugly class, I can see this in the constructor:

```ts
this.fetchDetails();
this.activatedRoute.paramMap.subscribe(params => {
  this.selectedCategory = params.get('selectedCategory');
  if (this.selectedCategory !== 'undefined') {
    this.fetchDescription(this.selectedCategory, 'en', 'itemListLabelKey');
  }
});
```

The fetchDetails() function will also call fetchDescription(), so Jim, why is it also called with the category when this is the item details page?

Good question Phil. If you keep on asking good questions like that, you're going to get smarter than me, oh yeah!

Uh, Mr Carrey, um, what's with the beard?

### #4 what to do with the rejected items info

The current run on the fallacies category shows this:

rejectedForNavigation 8
rejectedForReference 1
rejectedForCitation 23
rejectedForNoLabel 21
rejectedDuplicate 6
rejectedAsList 5

The Wikidata list has 18 items.
The Wikipedia list has 387 items.

So the end of list part is broken again for the fallacies.

For now, just leave these as comments in the the app since they will not be used for anything for a while.

Depending on how we capture them, it could be any of these:

- Lists portal
- Philosophy portal
- Cognitive distortion

The first to are already being excluded by other criteria.

```html
<li>
  <a href="/wiki/Cognitive_distortion" title="Cognitive distortion"
    >Cognitive distortion</a
  >
  &nbsp;– Exaggerated or irrational thought pattern
</li>
```

How can we distinguish this from the ones we want then?

```html
<li>
  <a href="/wiki/Vacuous_truth" title="Vacuous truth">Vacuous truth</a>
  u2013 a claim that is technically true but meaningless, in the form no
  <i>A</i> in <i>B</i> has <i>C</i>, when there is no <i>A</i> in <i>B</i>. For
  example, claiming that no mobile phones in the room are on when there are no
  mobile phones in the room.
</li>
x`x
```

- don't want:

```html
<li>
  <a href="/wiki/..." title="...">...</a>
  &nbsp;– ...
</li>
```

- want:

```html
<li>
  <a href="/wiki/..." title="...">...</a>
  u2013 ...
</li>
```

Is it really as simple as that?

But then see there are more:

```html
Cognitive distortion</a>&#160;&#8211;
```

However, if we just check for this string, then we reject about 500 items. That's a little too many methinks!

### #5 Issue #58 fallacies end of list function not working regression

The last item on our sample list of fallacies is Vacuous truth.

Looking at the items that come after this however gives a little surprise. The next item appears actually above the entry for vacuous truth, which means if we stop the loops then, we would miss out on that item and all items that need to be parsed after that.

```html
<li>
  <i>
    <a href="/wiki/Ad_hominem#Circumstantial" title="Ad hominem"
      >Circumstantial ad hominem</a
    >
  </i>
  – stating that the arguer's personal situation or perceived benefit from
  advancing a conclusion means that their conclusion is wrong.
  <sup id="cite_ref-68" class="reference">
    <a href="#cite_note-68">[68]</a>
  </sup>
</li>
```

To avoid this flaw in the end of list check, we probably shouldn't be doing it. The item should be checked for inclusion, or exclusion, no matter where in the list it is. This might be an issue for other lists, as we don't know the full breadth of the kind of lists layout Wikipedia has. So far we have just seen unordered lists and tables with various columns.

The above is OK to include. What does the html for

After a bit of time, there is a total 74 items combined from both lists.

The problem is, there are 156 on the combined list from the last time the category was generated. That was before adding the Wikipedia parsing functionality.

Might be worth getting the entire class before that work and re-implement it as a separate function as it was done back then. Then someone would have to figure out what is different and what is the same. At least let's know what was the commit that started the refactor so we can have a look at the previous working state.

It's somewhere in between here:
Commits on Feb 22, 2021 #38 first round of refactoring complete

and here:
Commits on Mar 6, 2021 #44 added notes on the fallacies sections

Originally, we had two separate functions to scrape the two different types:

```ts
const fallyList = this.getItemsFromFallaciesList(markup);
const cogbyList = this.getItemsFromCognitiveBiasesList(markup);
```

The list of fallacies is called the fallyList, a series of unordered lists that hold the items.
The list of cognitive biases is the other one which is a table based layout.

Then, it was decided to just use the same function for each. So now these function both call parseAllWikipediaPageItems().

Items to check:

Appeal to probability
Affirming a disjunct
Should reject anything from Cognitive distortion on.

Right off the bat we can see that the checkForEndOfListItem() function has rejected Appeal to probability.

We should use an enum of types instead of category names.

```ts
export enum Types {
  UnorderedList, // Fallacies: Types.UnorderedList
  TableList // Cognitive biases
}
```

Then, checking for the type table list, we see type 0 rejected Appeal to probability. Then we are back to the long list that adds all the items after the See Also section.

The first item after the end of the list is:

```html
<li>
  <a href="/wiki/Cognitive_distortion" title="Cognitive distortion">
    Cognitive distortion</a
  >
  &nbsp;– Exaggerated or irrational thought pattern
</li>
```

Since we've been here before, looking at the notes for "#4 what to do with the rejected items info", it
s clear that we didn't have a solution there. So then what was done the first time around when we created a working fallacies list which is still seen on the currently deployed app?

"Closes #60 and #58 wip" is the commit GitLens is showing me.

Also, introducing list type without much architectural thought here could be a problem. It should probably be decided in what we we want to capture the difference in business logic.

As much code should be shared between the different types as is logical.
Variations based on type should be layered so that a kind of domain-specific language can be created in the code which makes it obvious. I could also think back to my Java development days and think of some patterns that address this type of use case. The strategy pattern comes off the top of the head, so to speak, quack quack.

Look, somehow it was working some time ago, last sprint or more. So if someone could just produce the commit of that working state, that would be really great.

Someone could look at the firebase console and see what date that list was generated. Couldn't hurt.

It has the viewed data of 1615885028509.

[This site says](): Tue 16 March 2021 19:57:08. But GitHub shows issues by number of days ago. How many days ago was that? It's Feb. 18th right now, that's over a month.

GitHub says the commit was: closes #44 closes #45 closes #50 overwrite and save merged list of items working, items list broken for refactor.

So we could look at those issues and the commits associated with them.

Apart from the writeNewItemList() function in categories-store.ts and the removeBrackets() function, the work was already done previously. Still that state should contain what we want. It will just take more work to figure out what parts are different.

#### The original categories.store.ts file when fallacies were working

```js
if (_title === 'fallacies') {
  const fallyList = this.getItemsFromFallaciesList(markup);
} else if (_title === 'cognitive_bias') {
  const cogbyList = this.getItemsFromCognitiveBiasesList(markup);
}
...
  /**
   * Create an element from the document passed in
   * and parse it for an array of items and descriptions.
   * @param markup
   */
  getItemsFromFallaciesList(markup: any) {
    const main = this.createElementFromHTML(markup);
    const wikiItem: Item[] = this.parseAllWikipediaPageItems(main);
    return wikiItem;
  }
```

The function in question:

```js
  parseAllWikipediaPageItems(main: HTMLDivElement) {
    const unorderedLists = main.getElementsByTagName('ul');
    for (let i = 0; i < numberOfUnorderedLists; i++) {
      const li = unorderedLists[i].getElementsByTagName('li');
      for (let j = 0; j < li.length; j++) {
        const liAnchor: HTMLCollection = li[j].getElementsByTagName('a');
        const tr: HTMLCollectionOf<any> = li[j].getElementsByTagName('tr');
        const label = this.parseLabel(item);
        // Only capture items that have a label, which excludes table of contents, etc.
        if (label !== null) {
          const uri = liAnchor[0].getAttribute('href');
          // check for end of list and break out of loops if it is
          if (this.checkForEndOfList(label, item)) {
            endOfList = true;
            break;
          }
          // If the item has a sub-list, capture those items also and remove them from the description.
          const subList: Item[] = this.checkForSubListAndParseIfExists(item, label, wikiList);
          if (subList) {
            wikiList.push(...subList);
            descWithoutCitations = this.removeSubListMaterial(descriptionWithoutLabel, subList);
            // This call again seems redundant, which is a bit of a smell and should be sorted out.
            descWithoutCitations = this.removePotentialCitations(descWithoutCitations);
          }
          // create item and add it to the list
          const newWikiItem = this.createNewItem(label, descWithoutCitations, uri);
          if (wikiList.some(thisItem => thisItem.label === newWikiItem.label)) {
            // skip adding duplicates
          } else {
            wikiList.push(newWikiItem);
          }
        }
      }
    }
    return wikiList;
  }
```

That's all nice, but the check for the end of list is what supposedly used to work:

```ts
  checkForEndOfList(label: string, item: HTMLLIElement): boolean {
    if (label === 'Lists portal') {
      const span = item.getElementsByTagName('span');
      const img = span[0].innerHTML;
      if (img.indexOf('//upload.wikimedia.org/wikipedia/commons/thumb/2/20/Text-x-generic.svg/') !== -1) {
        return true;
      }
    }
    return false;
  }
```

How as Cognitive distortion triggering the end of list? That label is not even being found anymore. So that might be the problem. Maybe we have somehow excluded that label, and therefore broken the function?

There is a mention of that in the parsing-wikipedia-content.md document.

```html
<div
  role="navigation"
  aria-label="Portals"
  class="noprint portal plainlist tright"
>
  <ul>
    <li>
      <span><img .../></span>
      <span>
        <a href="/wiki/Portal:Lists" class="mw-redirect" title="Portal:Lists"
          >Lists portal</a
        >
      </span>
    </li>
    ...
  </ul>
</div>
```

Lets try and get that label again.

It looks like just moving the old check for end of list up in the function to before this line works:

```js
if (this.checkParent(item, type) && this.checkContent(label, item)) {
```

Then we get 18 + 141 items, which matches what we got for the current list on firebase.

Trying the list of cognitive biases shows these numbers: 109 + 197 = 306. Our list currently on firebase is 280. Uh-oh. There appear to be big differences.

The current state has "Agent detection" as it's first item.
On firebase, it's the poorly titled "Accident".

This sprint is two thirds finished now, so it's time for a commit/release at this point.

We will move to version 1.1.2, and raise a new issue for cognitive biases discrepancies.

### #6 Cannot convert undefined or null to object

```txt
[CategoriesStore] error fetching list TypeError: Cannot convert undefined or null to object
    at Function.keys (<anonymous>)
    at categories-store.ts:42
```

That's coming from this code:

```ts
Object.keys(result).forEach(key => {
  const value = result[key];
  cats.push(value);
});
```

The result is actually null. Not sure why now the categories are not working.

### #7 Cannot read property 'q' of undefined

```txt
zone.js:3372 GET https://www.wikidata.org/wiki/Special:EntityData/q.json 400
scheduleTask @ zone.js:3372
push../node_modules/zone.js/dist/zone.js.ZoneDelegate.scheduleTask @ zone.js:410
...
Show 188 more frames
core.js:4002 ERROR TypeError: Cannot read property 'q' of undefined
    at SafeSubscriber._next (item-details-store.ts:52)
```

Oh, the url param is 'q' when we have no q-code. Not idea.
Probably need a better route definition to distinguish between wikidata, wikipedia or items with both types of data.

This might have been the same as the problem reported in issue #36: property 'value' of undefined at SafeSubscriber.\_next (item-details-store.ts:46)

Closing that optimistically.

### #8 fix the icons (done)

Basically, we want to reverse what was done in this commit:
https://github.com/timofeysie/khipu/commit/d56d7ba1b5e6a3aba7421005ea0b43d85046ef1a

And fix the open/close icons on the add category page.

```txt
npm uninstall ionicons
```

The source <script src="https://unpkg.com/ionicons@5.4.0/dist/ionicons.js"></script> has already been removed from src/index.html.

But the hamburger icon is still not there: _Failed to load resource: the server responded with a status of 404 (Not Found)_

When in doubt, delete node modules and try again (after also deleting package-lock and doing a hard refresh).

```txt
npm install ionicons
```

The what the hell is this?

```txt
ERROR in node_modules/@types/color/index.d.ts:13:40 - error TS2716: Type parameter 'T' has a circular default.
13 interface Color<T extends ColorParam = ColorParam> {
                                          ~~~~~~~~~
** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/ **
i ｢wdm｣: Failed to compile.
```

Adding this to the angular.json:

```json
("src/assets",
{
  "glob": "**/*",
  "input": "node_modules/ionicons/dist/ionicons",
  "output": "./ionicons"
},
{
  "glob": "**/*.js",
  "input": "node_modules/ionicons/dist/",
  "output": "./"
})
```

Then got this error:

```txt
ERROR in node_modules/@types/color/index.d.ts:13:40 - error TS2716: Type parameter 'T' has a circular default.
13 interface Color<T extends ColorParam = ColorParam> {
```

Read this:

```txt
jmthibault79 commented on Feb 12, 2020
Pinning the @types/color version to 3.0.0 resolved this compile error for me on Typescript 3.1.6. Thanks for filing this bug.
```

Set 3.0.0 in package.json, and saw this TS error:

Module '@types/color' the installed version '3.0.1' is invalid

Errors go away and the project runs but still no icons.

We with both npm i ionicons again, and added the script in the index, then changed an md-menu to just menu, but the app was still search for md-menu. Opened the app in a incognito browser and logged in and the icons were there. Cached.

Saw this error also:

```txt
core.js:4002 ERROR Error: Uncaught (in promise): TypeError: Cannot read property 'uid' of null
TypeError: Cannot read property 'uid' of null
    at realtime-db.service.ts:250
```

Check for that first and move on. Also saw this on refresh:

zone.js:1129 GET https://unpkg.com/ionicons@5.4.0/dist/ionicons/svg/contact.svg 404

Where is that being used? Login? I can see the person icon next to the logged in user.

OK, it's here: src\app\shell\shell.component.html

```html
<ion-icon class="profile-icon" name="contact"></ion-icon>
```

Also seeing this:

```txt
[ionicons] Deprecated script, please remove: <script src="https://unpkg.com/ionicons@5.4.0/dist/ionicons.js"></script>
To improve performance it is recommended to set the differential scripts in the head as follows:
<script type="module" src="https://unpkg.com/ionicons@5.4.0/dist/ionicons/ionicons.esm.js"></script>
<script nomodule="" src="https://unpkg.com/ionicons@5.4.0/dist/ionicons/ionicons.js"></script>
```

However, without the <script src="https://unpkg.com/ionicons@5.4.0/dist/ionicons.js"></script> in the index.html file, there are no icons on refresh of the incognito window. The non-incognito window doesn't change regardless, no icons.

The incognito window with the working icons shows the network url being used as:

Request URL: https://unpkg.com/ionicons@5.4.0/dist/ionicons/svg/menu.svg

The non-working one:

Request URL: http://localhost:4200/svg/md-menu.svg

OK, so restarting the server and they both work the same. Not sure if this is a "fix" for the problem. Yes, icons will show this way, but shouldn't they be part of the app and not separate for downloads? Whatever. This is not a production app. It's a prototype, so this is worth taking off the table for now.

Getting ready to make a commit for this issue and there are 83 changed files. There should only be a could based on some fixes for items on the to do list but not 83.

main.ts has a squiggly orange line on the first character which has the hint:

```txt
Not using the local TSLint version found for 'c:/Users/timof/repos/timofeysie/khipu/src/main.ts'
To enable code execution from the current workspace you must enable workspace library execution.tslint(1)
```

One answer I see [on StackOverflow](https://stackoverflow.com/questions/65228384/tslint-extension-throwing-errors-in-my-angular-application-running-in-visual-stu) goes like this:

- Press Ctrl+Shift+P to open command pallet.
- In the input that pops up at the top of the VS Code, write TSLint: Manage workspace library execution" and press Enter.
- From the menu that replaces the input, pick Enable Workspace Library Execution

But that doesn't work for us. There is no option for TSLint: Manage blah blah.

### #9 Issue #55 Create link to Wikipedia on the details page

When debating about how to get the links into the detail page, it was decided that storing them in firebase and then loading those on the detail page was the best way to go.

Now, it appears like we don't have those links being added yet.

This is an example:

```js
description: "The tendency for explanations of other individuals' behaviors to overemphasize the influence of their personality and underemphasize the influence of their situation (see also Fundamental attribution error), and for explanations of one's own behaviors to do the opposite (that is, to overemphasize the influence of our situation and underemphasize the influence of our own personality).";
label: 'Actor-observer bias';
type: 'Attribution bias';
uri: '/wiki/Actor-observer_bias';
```

So why isn't the uri being added? Get it done!

The object when it is stored in the realtime db does this:

#### src\app\core\firebase\realtime-db.service.ts

```ts
const newItem = {
  'user-description': item.description ? item.description : '',
  'user-description-viewed-count': 0,
  'item-details-viewed-count': 0,
  'item-details-viewed-date': new Date().getTime(),
  uri: item.uri ? item.uri : '',
  wikidataUri: item.wikidataUri ? item.wikidataUri : ''
};
```

And I see that value in the [firebase console](https://console.firebase.google.com/project/khipu1/database/khipu1/data)

But the itemDetails object in the presentation layer doesn't have that property.

#### src\app\features\category-item-details\item-details\components\item-details\item-details.component.html

The object used in the template looks like this:

```json
{
  "aliases": {},
  "claims": {},
  "descriptions": {},
  "id": "",
  "labels": {},
  "lastrevid": 0,
  "modified": "",
  "ns": 0,
  "pageid": 0,
  "sitelinks": {},
  "title": "",
  "type": "",
  "userDescription": "The tendency for explanations of other individuals' behaviors to overemphasize the influence of their personality and underemphasize the influence of their situation (see also Fundamental attribution error), and for explanations of one's own behaviors to do the opposite (that is, to overemphasize the influence of our situation and underemphasize the influence of our own personality)."
}
```

A failed mapping of the firebase item, with only the description working. We don't even have the title except from the router url.

I mean, this object is also supposed to hold a Wikidata item:

```json
description: "The tendency to depend excessively on automated systems which can lead to erroneous automated information overriding correct decisions."
label: "Automation bias"
type: "False priors↵"
uri: "/wiki/Automation_bias"
```

Tracking the data back to it's source:

```js
@Input() itemDetails: ItemDetails;
```

Passed into that component by the smart container:

#### src\app\features\category-item-details\item-details\container\item-details\item-details-container.component.html

```html
<item-details [language]="language" [itemDetails]="(store.state$ |
async).itemDetails" ...
```

OK. Found the bug. In the fetchFirebaseItemAndUpdate() function:

```js
this.realtimeDbService
  .readUserSubDataItem('items', this.selectedCategory, itemListLabelKey)
  .then((existingItem: any) => {
    if (existingItem && existingItem['user-description'] && existingItem['user-description'] !== '') {
      // if the firebase meta info user description exists, use thatthis.state.itemDetails.
+     this.state.itemDetails = existingItem;
      this.state.itemDetails.userDescription = existingItem['user-description'];
    } else if (existingItem && existingItem['user-description'] === '') {
```

The only thing being added was the user description, which is mapped from snake-case to camelCase. We had to also set the rest of the items. We should just use camelCase for the firebase schema. Sometimes it doesn't pay to follow the docs who's examples all include snake-case.

### #10 Redirect to data uri value (Issue #57)

Raised an [issue #57 for this](https://github.com/timofeysie/khipu/issues/57).

error: "Redirect to data uri value"
headers: HttpHeaders {normalizedNames: Map(0), lazyUpdate: null, lazyInit: ƒ}
message: "Http failure response for https://radiant-springs-38893.herokuapp.com/api/detail/Anthropomorphism%20orpersonification/en/false: 300 Multiple Choices"
name: "HttpErrorResponse"
ok: false
status: 300
statusText: "Multiple Choices"
url: "https://radiant-springs-38893.herokuapp.com/api/detail/Anthropomorphism%

I saw this again when going to cognitive_biases/anchoring or focalism. It looks lie the description from the previous item is being shown:

"The tendency to avoid options for which the probability of a favorable outcome is unknown."

To test this theory, I go back and choose the ambiguity effect and see the user-description with this in the edit field:

"The tendency to rely too heavily, or "anchor", on one trait or piece of information when making decisions (usually the first piece of information acquired on that subject)."

Which looks like the former anchoring or focalism description.

### #11 Refactor the item-details.store and friends

The store is a mess, and the whole feature has a mix of the history of the mess along with an almost working implementation.

The container template shows how things have just been added without refactoring so far:

```html
[itemDetails]="(store.state$ | async).itemDetails" [description]="(store.state$
| async).itemDetails.descriptions" [userDescription]="(store.state$ |
async).itemDetails.userDescription"
```

There is no need to pass the object and properties from the object. They used to be different things, but time to clean it up now.

The file refactoring-item-details-store.md has the notes on this process. It's a good time to take care of this in this bug fixing sprint.

### #12 Use an observer instead of a complete callback for the router params

### #13 Cannot read property 'en' of undefined on user description update

I addition to all the other regressions from refactoring the store classes and including Wikipedia descriptions for both fallacies and cognitive biases, the update feature is broken.

When trying to update an items user description, we get this error:

ItemDetailsComponent.html:21 ERROR TypeError: Cannot read property 'en' of undefined
at ItemDetailsComponent.push../src/app/features/category-item-details/item-details/components/item-details/item-details.component.ts.ItemDetailsComponent.onDescriptionUpdated (item-details.component.ts:26)

```js
onDescriptionUpdated(event: any) {
  this.descriptionUpdated.emit({ event: event, label: this.itemDetails.labels[this.language] });
}
```

Even switching the label to the title passed into the route param, there is no updated happening.

### #14 Allow links on detail pages to work #54

### #15 Start using GitHub projects

Moving towards organizing the work for this project into sprints has been a great way to see progress and predict velocity.

So far, it has just been some basic note taking structure connected with GitHub issues and milestones.

Looking at an [example of GitHub projects](https://github.com/ParabolInc/parabol/projects/2) shows the extent to which this should happen.

There are as number of project templates available:

1. None: Start from scratch with a completely blank project board. You can add columns and configure automation settings yourself.
2. Basic kanban: Basic kanban-style board with columns for To do, In progress and Done.
   Automated kanban: Kanban-style board with built-in triggers to automatically move issues and pull requests across To do, In progress and Done columns.
3. Automated kanban with reviews: Everything included in the Automated kanban template with additional triggers for pull request reviews.
4. Bug triage: Triage and prioritize bugs with columns for To do, High priority, Low priority, and Closed.

At this point, we don't have reviews, but having a pull review structure setup adds an extra safety net before things get deployed.

These days, as the only developer on the project, PRs have not been done. But in planning out how to work with future devs, this is part of that. So going with option three for now: Automated kanban.

The card concept is a little strange: _Cards can be added to your board to track the progress of issues and pull requests. You can also add note cards, like this one!_

Turns out you can just link the issue and that shows up. Cool.

https://github.com/timofeysie/khipu/projects/1

## Random work

ERROR Error: Uncaught (in promise): TypeError: Cannot read property 'uid' of null
TypeError: Cannot read property 'uid' of null
at RealtimeDbService.push../src/app/core/firebase/realtime-db.service.ts.RealtimeDbService

Firebase setup problems again. Didn't account for all the errors on every function and just fixed them one by one.
