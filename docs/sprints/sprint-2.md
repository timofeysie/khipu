# Sprint 2

Start date: April 3rd, 2021.
End date: April 30th, 2021.

Sprint planning: scope of sprint, all issues story-pointed, set a sprint target name.

Target: UAT sprint - fix all the bugs from the last two sprints.

## Retro

### What went well?

- good to have a better working more dependable app

### What could be improved?

- less regressions while refactor
- scope creep needed to catch all the bugs
- couldn't finish everything

## TODO List

Here is the list of to do items for this sprint.

1. DONE Non-adaptive choice switching uri
2. ???? Cannot read property 'includes' of null
3. DONE - detail pages lead to general description, not a detail
4. DONE - what to do with the rejected items info
5. DONE - #58 fallacies end of list function not working regression
6. CAN't REPRODUCE - Cannot convert undefined or null to object
7. DONE - Cannot read property 'q' of undefined
8. DONE - #47 fix the icons
9. DONE - #55 Create link to Wikipedia on the details page
10. Redirect to data uri value response error (Issue #57)
11. Refactor the item-details-store and friends
12. Use an observer instead of a complete callback for the router params
13. DONE Cannot read property 'en' of undefined on user description update
14. DONE - Allow links on detail pages to work (Issue #54)
15. DONE - Start using GitHub projects
16. ???? Cognitive biases parsing has regressed (maybe)
17. DONE - User description update not working (Issue #64)
18. DONE - Set default user description not working
19. DONE - Title not showing for items with no descriptions?
20. First time going to a detail page, the user description is not filled

## Backlog grooming

It's time to raise issues for the items here that have not been fixed if they haven't already. It's no fun scrolling up and down this page trying to figure out the status of each.

After most of the issues above were ticked off one by one, there are only two issues remaining still on the GitHub issues board:

- #57 Http failure response "Redirect to data uri value" for the cognitive biases "anchoring or focalism"
- #58 Allow going to a detail for items that have no info

Here are the rest:

- DONE #1. Non-adaptive choice switching uri
- ???? #2. Cannot read property 'includes' of null
- DONE #6. Cannot convert undefined or null to object
- #11. Refactor the item-details-store and friends
- #12. Use an observer instead of a complete callback for the router params
- DONE #13. Cannot read property 'en' of undefined on user description update
- ??? #16. Cognitive biases parsing has regressed (maybe)

### #1 The item "Non-adaptive choice switching" is still an issue for the uri

Here are the notes from parsing-wikipedia-content.md.

### [75] citation as title

```txt
description: "After experiencing a bad outcome with a decision problem, the tendency to avoid the choice previously made when faced with the same decision problem again, even though the choice was optimal. Also known as "once bitten, twice shy" or "hot stove effect"."
label: "[75]"
type: "↵"
uri: "#cite_note-75"
```

From this markup:

```html
<tr>
  <td>
    Non-adaptive choice switching
    <sup id="cite_ref-75" class="reference">
      <a href="#cite_note-75">&#91;75&#93;</a></sup
    >
  </td>
  <td></td>
  <td>
    After experiencing a bad outcome with a decision problem, the tendency to
    avoid the choice previously made when faced with the same decision problem
    again, even though the choice was optimal. Also known as "once bitten, twice
    shy" or "hot stove effect".
  </td>
</tr>
```

We can see where the [7] comes from now. It's a similar problem in the case of the span.

It's not actually difficult to fix, as we can just use our removed HTML and remove potential citations, and that gives just the title as string needed.

Those were the notes, but since we don't see that citation as a label anymore, it's probably been fixed and not check off as done. So closing this for now.

### #2 cannot read property 'includes' of null

Is this the same as the above? The error is the same.

```txt
core.js:4002 ERROR Error: Uncaught (in promise): TypeError: Cannot read property 'includes' of null
TypeError: Cannot read property 'includes' of null
    at CategoriesStore.push../src/app/features/category-item-details/categories/categories-store.ts.CategoriesStore.logParsing (categories-store.ts:350)
```

I think a check for null was added before line 350 to address this, so leave it for now. If this happens again the steps to reproduce should be captured and an issue raised.

Not sure if I saw this again right now. Have to keep it open just in case.

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

Uh, Mr Carey? Um, what's with the beard?

We all thought this was not happening anymore, but saw it on the deployed app again today with the "inflation of conflict" fallacy.

Fallacy "inflation of conflict" leads to detail about all fallacies.
The user description is "the phrase "correlation does not imply causation" refers to the inability to legitimately deduce a ..."

The Wikipedia description is: "Types of reasoning that are logically incorrect"

After going to some other items that worked as expected and coming back to this detail pages then show the user description from the slide out panel in the list matches the user description in the detail page edit field: "arguing that, if experts in a field of knowledge disagree on a certain point within that field, no conclusion can be reached or that the legitimacy of that field of knowledge is questionable."

Trying the item locally, and looking at the log for that item, firebase is hit three times, and the network once: as usual, we don't get the line number of the class, only that of the logger: logger.service.ts:107 [RealtimeDbService]:

```txt
path items/X0YFaM8hXHdm89FWEQsj0Aqhcln1/fallacies
Cache set for key: "https://radiant-springs-38893.herokuapp.com/api/details/en/Inflation of conflict"
routeToData items/X0YFaM8hXHdm89FWEQsj0Aqhcln1/fallacies/Inflation of conflict
Cache set for key: "https://radiant-springs-38893.herokuapp.com/api/detail/Inflation of conflict/en/false"
```

Adding some numbers to the error messages and refreshing we see this:
[RealtimeDbService] 13. routeToData items/X0YFaM8hXHdm89FWEQsj0Aqhcln1/fallacies/Inflation of conflict

Looking at the content again, the start "Types of reasoning that are logically incorrect" also appears in the preamble for the list of fallacies page that is parsed in the add category function.

Also, just noticing that the spaces in the db path are still there. That might be the issue, or it might not. If it were a problem, then maybe none of the items would work. But most of them do, so it doesn't actually seem to be an issue. We don't have to encode the url since the network calls are made internally by the firebase lib.

It may not be an issue for the db items, but it looks like the same is being used without url encoding for the network calls also.

encodeURI() is actually a regular Javascript function. It seemed like it might be a caching issue, but in an incognito tab, same deal.

It turns our the Wikipedia result is actually returning the html for a the list of fallacies page.

"Inflation of conflict" has no link even on the list of fallacies table. The link actually goes here:

https://en.wikipedia.org/wiki/List_of_fallacies#Inflation_of_conflict

There aren't many more on that list. "Naturalistic fallacy fallacy (anti-naturalistic fallacy)" should be the same. It's link looks like this:

https://en.wikipedia.org/wiki/Main_Page#cite_note-100

The user description has an issue also:

```txt
 inferring an impossibility to infer any instance of ought from is from the general invalidity of is-ought fallacy, mentioned above. For instance, is P ∨ ¬ P
  {\displaystyle P\lor \neg P} does imply ought P ¬
  {\displaystyle P\lor \neg P} for any proposition P
  {\displaystyle P}
, although the naturalistic fallacy fallacy would falsely declare such an inference invalid. Naturalistic fallacy fallacy is a type of argument from fallacy.
```

Those strange parts are logical vernaculars. The parts in the brackets need to be removed however.

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

CAN't REPRODUCE,

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

Not sure about the above issues, but going to this item after closing most of the other issues, there are two Javascript errors:

```txt
logger.service.ts:107 [ErrorHandlerInterceptor] Request error
HttpErrorResponse {headers: HttpHeaders, status: 300, statusText: "Multiple Choices", url: "https://radiant-springs-38893.herokuapp.com/api/detail/Anchoring%20or%20focalism/en/false", ok: false, …}
error: "Redirect to data uri value"
headers: HttpHeaders {normalizedNames: Map(0), lazyUpdate: null, lazyInit: ƒ}
message: "Http failure response for https://radiant-springs-38893.herokuapp.com/api/detail/Anchoring%20or%20focalism/en/false: 300 Multiple Choices"
name: "HttpErrorResponse"
ok: false
status: 300
statusText: "Multiple Choices"
url: "https://radiant-springs-38893.herokuapp.com/api/detail/Anchoring%20or%20focalism/en/false"
__proto__: HttpResponseBase
...
core.js:4002 ERROR TypeError: Cannot read property 'split' of undefined
    at SafeSubscriber._next (item-details.store.ts:111)
```

That second one should be a quick fix. But without that, the first error is still there.

Since this is a backend issue now, maybe it should be raised as an issue on the [conchifolia project](https://github.com/timofeysie/conchifolia).

The notes for conchifolia have a mention of this error:

```txt
https://ko.wikipedia.org/w/api.php?action=parse&section=0&prop=text&format=json&page=%ED%98%84%EC%83%81_%EC%9C%A0%EC%A7%80_%ED%8E%B8%ED%96%A5
```

_We weren't passing the lang and leave case alone args into the details.redirect function. Duh! But even after making that change and pushing the result to Heroku, now ALL the detail pages in the Loranthifolia client app are showing "300 multiple choices failed" errors._

_Maybe there was some network issues or caching of old code? Anyhow, now all the Korean redirects seem to be working. Loranthifolia might finally be ready for it's first release._

What does Khipu shows with regards to that query in the nextwork tab?

Request URL: https://radiant-springs-38893.herokuapp.com/api/details/en/Anchoring%20or%20focalism

Response:

{"batchcomplete":"","query":{"pages":{"-1":{"ns":0,"title":"Anchoring or focalism","missing":""}}}}

Missing.

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

The first step was to remove the dash so that the file name follows the .store naming convention used elsewhere.

That done, another simple task is to clear up the API for this function:

```js
fetchWikimediaDescriptionFromEndpoint(
  (_title: string),
  (_language: string),
  (itemListLabelKey: string)
);
```

It is currently used in two places:

Inside the item-details.store class constructor, fetchDetails() it is called for the Wikipedia items:

```js
this.fetchWikimediaDescriptionFromEndpoint(label, 'en', label);
```

The second time it is called in the fetchDescription() function:

```js
this.fetchWikimediaDescriptionFromEndpoint(
  _title,
  sparqlLanguageObject.sparqlLanguage,
  itemListLabelKey
);
```

A TODO in this second spot says "check firebase first". It's hard to determine if this second usage is valid or not needed, as well as the usage of the third argument which appears to the the same as the first.

Going back to the fetchDetails() function, the first branch for Wikidata items will lead to fetchDescription() as shown in some pseudo code:

```js
fetchDetails() {
  if (qcode !== 'q') { // 1. Wikidata qcode
    this.fetchDetailsFromEndpoint(qcode, sparqlLanguageObject.sparqlLanguage);
  const label = params.get('label');
  if (label) { // 2 Wikipedia item
    this.fetchWikimediaDescriptionFromEndpoint(label, 'en', label);
```

```js
fetchDetailsFromEndpoint() -> this.fetchDescription()
```

So it's actually possible that fetchWikimediaDescriptionFromEndpoint() can be called twice now that we are using the same route for details for both types. It should be an either or affair.

It also might mean that issue #20 might be caused by this.

### #12 Use an observer instead of a complete callback for the router params

TODO: Add description at least for this.

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

This was opened as a duplicate on #17 and has been closed so closing this also.

### #14 Allow links on detail pages to work #54

The first item on the cognitive biases list looks like this:

```txt
description: ""
label: "Accentuation effect"
uri: ""
wikidataUri: undefined
```

It's possible neither Wikipedia nor Wikidata have a uri, but not very likely. Lets look at the markup from the source: funny, there is none. That's more than weird. It's bordering on impossible.

It's possible it's been deleted from Wikipedia. There is a page for it: https://en.wikipedia.org/wiki/Accentuation_effect

The description: _Accentuation effect occurs when something (be it a person, place or thing) is placed into a category. The differences between the categories are then exaggerated, and differences within the categories themselves are minimised. Memory of anything that can be categorized is subject to an accentuation effect in which the memory is distorted toward typical examples._

At the bottom of the page it says "Categories: Cognitive biases". So why isn't it on our list?

Accentuation effect does not appear on our sample html, which should have been the same thing that was parsed to create the list that is on firebase right now. So maybe the parsing is working as it should?

Mysteries aside for the moment, if we want to go to a detail page regardless of any description or uri's, we need a third option here:

```js
if (item.uri) {
  // wikipedia item
  this.router.navigate([
    `/categories/item-details/${this.category.name}/q/${item.label}`
  ]);
}
if (item.wikidataUri) {
  // wikidata item
  const lastSlash = item.wikidataUri.lastIndexOf('/');
  const qCode = item.wikidataUri.substring(
    lastSlash + 1,
    item.wikidataUri.length
  );
  this.router.navigate([`/categories/item-details/${this.category}/${qCode}`]);
}
```

The first block doesn't actually rely on the the item.uri. So the solution might be to just reverse the blocks and instead of the second if, just use an else.

That works, but then we get an error on the detail page:

```err
error TypeError: Cannot read property 'title' of undefined
    at ItemDetailsStore.push../src/app/features/category-item-details/item-details/item-details-store.ts.ItemDetailsStore.createDefaultDescription (item-details-store.ts:189)
```

Line 189:

```js
const label = this.state.itemDetails.sitelinks[language + 'wiki'][
  'title'
].toLowerCase();
```

http://localhost:4200/categories/item-details/cognitive_biases/q/Accentuation%20effect

Catch that error and then we have some old behavior that needs to be updated:

```txt
item-details-viewed-count: 0
item-details-viewed-date: 1616904372956
uri: ""
user-description: ""
user-description-viewed-count: 0
userDescription: "accentuation effect occurs when something (be it a person, place or thing) is placed into a categor..."
wikidataUri: "http://www.wikidata.org/entity/Q97221754"
```

Also, it's writing the item directly under the user id in firebase (glad I checked).

That has to stop. What is should be doing is writing the 'user-description', and in the proper place.

One thing I don't like about our logger service is

```txt
_sanitizeHtml @ core.js:4689
push../node_modules/@angular/platform-browser/fesm5/platform-browser.js.DomSanitizerImpl.sanitize @ platform-browser.js:1871
setElementProperty @ core.js:28554
... seriously like 200 lines in the stack trace ...
... and then at the end you find out there is ...
... almost another three hundred lines that were hidden ...
Show 291 more frames
logger.service.ts:107 [RealtimeDbService] write successful3
```

Instead of getting the line number in the code, we get the line number of the logger printing out the message. Not great. It means you have to make sure each error message is unique. Not bad really, as this is a good practice anyhow, it's just a little annoying I suppose.

The function being called is on line 219:

```js
writeDescription(detail: any, itemLabel: string, category: string) { }
```

Which function should it be? Whatever it is, it has the following path:

```txt
items/X0YFaM8hXHdm89FWEQsj0Aqhcln1/Accentuation effect/cognitive_biases/user-description
```

Called in:

this.realtimeDbService.writeDescription(existingItem, this.selectedCategory, itemListLabelKey);

this.realtimeDbService.writeDescription(existingItem, this.selectedCategory, itemListLabelKey);

It should be writeDescription(detail, itemLabel, category)

#### Differences in the lists

In search of other differences. The current firebase list starts off with this:

```txt
Accentuation effect
Actor-observer Bias
Agent Detection
Ambiguity Effect
Anchoring Or Focalism (no uppercasing 'or'!)
Anthropocentric Thinking
Anthropomorphism Orpersonification (where did the space go?)
Attention Bias
...
```

When parsing locally, the list looks like this:

```txt
Agent Detection
Ambiguity Effect
Anchoring Or Focalism (no uppercasing 'or'!)
Anthropocentric Thinking
Anthropomorphism Orpersonification (where did the space go?)
Attention Bias
... same as above
```

So where has the Agent Detection and Ambiguity Effect come from? Neither of them appear in our sample source document. Maybe we need a new sample source?

Someone here also needs to figure out how to get the latest diff from Wikipedia to see what additions/deletions have happened in a document since it was last used.

This feature is nice, but it seems this is more of a global thing. How often will a user be regenerating the list? If a lot of users are learning the same list, then we don't want each user to have to determine each time they look at a list what has changed individually.

Some kind a admin feature that would keep track of all the lists that all the users are studying, then get a diff say everyday if a user looks at one of those lists, and share the results with all the other users who then want to look at the list.

Since we want the system to be scalable, this feature could be tricky to support on a large scale. For now I would like to know what the Wikipedia api is to get this info. I bet it's contained in the response already, I mean, the last date of edit.

There is this in a comment at the end of the file: timestamp 20210320205105

Some other details of that section:

```html
<!-- 
      NewPP limit report
      Parsed by mw1366
      Cached time: 20210320205108
      Cache expiry: 2592000
      Dynamic content: false
      Complications: [vary‐revision‐sha1]
      CPU time usage: 2.300 seconds
      Real time usage: 2.789 seconds
      Preprocessor visited node count: 9564/1000000
      Post‐expand include size: 319993/2097152 bytes
      Template argument size: 5000/2097152 bytes
      Highest expansion depth: 15/40
      Expensive parser function count: 4/500
      Unstrip recursion depth: 1/20
      Unstrip post‐expand size: 465223/5000000 bytes
      Lua time usage: 1.478/10.000 seconds
      Lua memory usage: 9792548/52428800 bytes
      Lua Profile:
          ?                                                                400 ms       26.0%
          Scribunto_LuaSandboxCallback::gsub                               180 ms       11.7%
          dataWrapper <mw.lua:661>                                         140 ms        9.1%
          Scribunto_LuaSandboxCallback::find                               120 ms        7.8%
          Scribunto_LuaSandboxCallback::callParserFunction                 100 ms        6.5%
          Scribunto_LuaSandboxCallback::getContent                          80 ms        5.2%
          recursiveClone <mwInit.lua:41>                                    80 ms        5.2%
          Scribunto_LuaSandboxCallback::plain                               60 ms        3.9%
          Scribunto_LuaSandboxCallback::getExpandedArgument                 40 ms        2.6%
          <mw.lua:683>                                                      40 ms        2.6%
          [others]                                                         300 ms       19.5%
      Number of Wikibase entities loaded: 0/400
      -->
<!--
      Transclusion expansion time report (%,ms,calls,template)
      100.00% 2516.413      1 -total
       49.95% 1256.861      1 Template:Reflist
       25.95%  652.983     31 Template:Annotated_link
       24.59%  618.766     91 Template:Template_parameter_value
       21.06%  529.944     78 Template:Cite_journal
       14.46%  363.980     36 Template:Cite_book
        4.81%  121.020     16 Template:Harvnb
        3.46%   87.019      1 Template:Short_description
        3.21%   80.806     16 Template:Cite_web
        2.72%   68.337      1 Template:Biases
      -->
<!-- Saved in parser cache with key enwiki:pcache:idhash:510791-0!canonical and timestamp 20210320205105 and revision id 1009156013. Serialized with JSON.
      -->
```

That looks more like a cache time, not a date last edited. Or maybe that is the same thing?

Does the revision id match what we would get now?

The last part from today:

```html
<!-- Saved in parser cache with key enwiki:pcache:idhash:510791-0!canonical and timestamp 20210422191312 and revision id 1017957950. Serialized with JSON.
 -->
```

Do those revision ids go up incrementally?

Even with this info, know what has changed is important also. Just a giant diff like a pull request with two sides is not really the kind of thing people would want to see. To determine items that have been added or removed, we need to have a consistent parsing function.

Here is what we were looking for:

```html
<tr>
  <td>
    <a href="/wiki/Agent_detection" title="Agent detection">Agent detection</a>
  </td>
  <td>False priors</td>
  <td>
    The inclination to presume the purposeful intervention of a sentient or
    intelligent
    <a href="/wiki/Agency_(philosophy)" title="Agency (philosophy)">agent</a>.
  </td>
</tr>
```

Unfortunately, since we are uppercasing words, looking for "Agent Detection" will not find "Agent detection". The item _does_ appear on the first list.

So wait, there are 280 from the current firebase list. If we re-parse the list it's 109 + 197 = 306.

Then where are the 260 items that are different?

We could do the diff in the client, as it has the parsing functionality, then send the results back to the server for caching.

#### The real links on details pages issue

After all the above, and after fixing #18, it was realized by C3P0 that this issue is really about the relative links on the wikipediaDescription section to work to go to that page.

This just means creating the full wikipedia link from the partial one.

Since that is an @Input() wikipediaDescription in src\app\features\category-item-details\item-details\components\item-details\item-details.component.ts, that component should remain dumb and not try to do anything like this. So move up the chain to src\app\features\category-item-details\item-details\container\item-details\item-details-container.component.html.

There it's coming from the state:

```html
[wikipediaDescription]="(store.state$ | async).wikipediaDescription"
```

So move up the chain again to the item-details.store.

src\app\features\category-item-details\item-details\item-details-store.ts

And by the way, it's time to rename item-details-store.ts to item-details.store.ts to match the other xxx.store.ts naming convention.

But first, add the full link.

As an example of what we want to do, we want to take this:

```html
<a href="/wiki/Social_psychology" title="Social psychology">
  social psychology</a
>
```

And create this:

```html
<a
  href="https://en.wikipedia.org/wiki/Social_psychology"
  title="Social psychology"
>
  social psychology</a
>
```

That's all it takes.

Commit message: closes #54 converted links on detail pages to full urls

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

## #16 Cognitive biases parsing has regressed

Trying the list of cognitive biases shows these numbers: 109 + 197 = 306. Our list currently on firebase is 280. Uh-oh. There appear to be big differences.

The current state has "Agent detection" as it's first item.
On firebase, it's the poorly titled "Accident".

## Random work

ERROR Error: Uncaught (in promise): TypeError: Cannot read property 'uid' of null
TypeError: Cannot read property 'uid' of null
at RealtimeDbService.push../src/app/core/firebase/realtime-db.service.ts.RealtimeDbService

Firebase setup problems again. Didn't account for all the errors on every function and just fixed them one by one.

### #17. User description update not working

After #54, "Allow links to work for items with no description", when we do get to the user page, we want to be able to set a default description automatically.
This means actually refactoring the item-details.store.

That should be a separate issue. Anyhow, start with the update.

In Item details store has a function called: fetchFirebaseItemAndUpdate()

It has the following workflow:

```js
this.realtimeDbService
  .readUserSubDataItem('items', this.selectedCategory, itemListLabelKey)
  .then((existingItem: any) => {
    if (
      existingItem &&
      existingItem['user-description'] &&
      existingItem['user-description'] !== ''
    ) {
      // #1 if the firebase meta info user description exists, use that.  ie: this.state.itemDetails.
      // Should be the case if there is a description to show on the item list.
    } else if (existingItem && existingItem['user-description'] === '') {
      // #2  item has only label
      // pre-fill a blank descriptions and save them back to the db
      // this.realtimeDbService.writeDescription(existingItem, itemListLabelKey, this.selectedCategory);
    } else if (
      newDefaultUserDescription &&
      existingItem &&
      existingItem.userDescription !== ''
    ) {
      // #3 if the result of the fetchWikimediaDescriptionFromEndpoint has a new default description, use that
      // p.s. we don't need to write what has just come from the db!
    } else {
      // #4 is split into various conditions
      if (this.state.itemDetails && existingItem) {
        // #4a this appears to be overwriting the description.
      } else {
        // #4b backup to wikimedia description
        // this will most likely result in markup being put into the description,
        // so if this is really something we want, then it should be stripped.
      }
    }
  })
  .catch(error => {
    log.error('error', error);
  });
```

If here is a description already in the items list, then block #1 is executed.

When the item has only label, block #2 is executed.

Despite "Attitude polarization" having no description on the list of cognitive biases, the default description is showing up on the details page.

"in social psychology, group polarization refers to the tendency for a group to make decisions that ..." shows up as the default user description. It's coming from the Wikimedia description.

There are two stores being imported into the item-details component:

```js
import { ItemDetailsStore } from '../../item-details-store';
import { ItemsStore } from '../../../items/items.store';
```

When the user taps "Update description" the event emits to the item store.

```js
this.itemsStore.updateUserDescription({
  ...event,
  category: this.selectedCategory
});
```

Now I'm no genius, but it seems like that should be a function of the item-details.store.

### #18. Set default user description not working

Attitude polarization shows the description from Wikimedia in the user description edit box.

This is the default as the initial item has no description.

The next time going to that page, there is no pre-filled description. What happened to that feature?

Adding this "the tendency for a group to make decisions that are more extreme than the initial inclination of its members." and tapping update shows the event:

item-details-container.component.ts:49
event: "the tendency for a group to make decisions that are more extreme than the initial inclination of its members."
label: "Attitude polarization"

The event is checked like this:

```js
if (event.label['value']) { ... }
```

No wonder it's not working. Also, the category was being written as the label without the underscore. Use the raw category with the underscore "cognitive_biases" and then our descriptions are updating again.

Closes #64 cleaned up the event and used the raw category to description update.

### Number 19. Title not showing for items with no descriptions?

This might get fixed along with 17, 18, 19.

Alright, so with the title, there are actually three conditions that show different titles.

Here is some pseudo code to make them clear:

```js
if (itemDetails.sitelinks && itemDetails.sitelinks[language + 'wiki']) {
  // link title to Wikidata page
} else noSiteLinks {
  if (language && itemDetails['uri']) {
    // link title to Wikipedia page
  } else {
    // noLinkTitle
}
```

Probably that can be cleaned up, or maybe not, since it relies on template micro-syntax notation.

Actually, there could be a case where we have a Wikipedia page and a Wikidata page to link to. There is also the possibility to just allow the user to go a Google search on the label.

So there should be a label with three links. Not sure what is the best UX to show this.

Something like:

label - Wikipedia Wikidata Google

First fix what we have.

"Attitude polarization" is a Wikidata item. So there should be a link that goes to this page:

https://www.wikidata.org/wiki/Q536046

However, I don't see the q-code getting passed in the uri as it should. Yet another regression to fix.

I can see that on the firebase entry:

wikidataUri: "http://www.wikidata.org/entity/Q536046"

So why isn't it getting to the list?

This is why: items-container.component:

```txt
description: result[label]['user-description'],
uri: result[label]['uri'],
wikidataUri: result[label]['wikidata-uri']
```

There is a mismatch there. If that is changed to wikidataUri, then it will be there, but the uri for the detail page then looks like this:

http://localhost:4200/categories/item-details/%5Bobject%20Object%5D/Q536046

So where is that route happening?

It's not the greatest routing I have seen:

#### **`src\app\features\category-item-details\items\container\items-container.component.ts` routing**

```js
if (item.wikidataUri) {
  // wikidata item
  const lastSlash = item.wikidataUri.lastIndexOf('/');
  const qCode = item.wikidataUri.substring(
    lastSlash + 1,
    item.wikidataUri.length
  );
  this.router.navigate([
    `/categories/item-details/${this.category.name}/${qCode}`
  ]);
} else {
  // wikipedia item
  this.router.navigate([
    `/categories/item-details/${this.category.name}/q/${item.label}`
  ]);
}
```

So now we have this uri:

http://localhost:4200/categories/item-details/cognitive_biases/Q536046

Then, the title is broken again!

The title was not available as it wasn't passed in the routing. Lets just have one route. The q-code/label can work for both Wikipedia and Wikidata items.

Now we have the title and the link to the Wikidata file. On the Wikidata page, we see a list of links by language. Under the English section we see:

https://en.wikipedia.org/wiki/Attitude_polarization then is redirected to this:

https://en.wikipedia.org/wiki/Group_polarization#Attitude_polarization

It's quite a bit of work then to automatically follow that. Since sometimes there is no link for the users current language, it's a minefield of exceptions and edge cases. For now, things are working somewhat and the user hopefully can find what they want.

### #20 First time going to a detail page, the user description is not filled

This was an issue before. Not sure when it stopped working or if it was ever fixed.

Was there a ticket for this?

Ad Iram will never show it's user description in the details field.

Firebase is not being consulted for Wikidata items.

Adding more time to the timeout in the description.form.component works to let the description show up after it arrives. Tried changing the change detection strategy to on push but that didn't help get rid of the timeout hack.

The order of execution then for "ad iram" for which there is no Wikipedia page is:

1. 1. Wikidata qcode
      item-details.store.ts:58 a {entities: {…}}
      item-details.store.ts:65 itemDetails Ad iram
      item-details.store.ts:88 b
      item-details.store.ts:125 c {batchcomplete: "", query: {…}}
      item-details.store.ts:144 d
      logger.service.ts:107 [ErrorHandlerInterceptor] Request error HttpErrorResponse {headers: HttpHeaders, status: 300, statusText: "Multiple Choices", url: "https://radiant-springs-38893.herokuapp.com/api/detail/Ad%20iram/en/false", ok: false, …}
      Show 319 more frames
      item-details.store.ts:108 e Error, could not load details.
      logger.service.ts:107 [RealtimeDbService] 14. routeToData items/X0YFaM8hXHdm89FWEQsj0Aqhcln1/fallacies/Ad iram
      item-details.store.ts:170 existing item {item-details-viewed-count: 0, item-details-viewed-date: 1615885028509, uri: "", user-description: "accusing one's opponent of being angry or holding …isproves their argument or diminishes its weight.", user-description-viewed-count: 0, …}

The HttpErrorResponse for one of the items calls needs to be shown to the user.

```txt
url: "https://radiant-springs-38893.herokuapp.com/api/detail/Ad%20iram/en/false"
error: "Redirect to data uri value"
ok: false
status: 300
statusText: "Multiple Choices"
```

There is nothing descriptive enough there, so [raise an issue](https://github.com/timofeysie/conchifolia/issues/13) with that project to get that changed.
