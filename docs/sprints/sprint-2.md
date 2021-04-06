# Sprint 2

Start date: April 3rd, 2021.

Sprint planning: scope of sprint, all issues story-pointed, set a sprint target name.

Target: fix all the bugs from the last two sprints,

Here is the list of to do items for this sprint.

1. Non-adaptive choice switching uri
2. Cannot read property 'includes' of null
3. DOME - detail pages lead to general description, not a detail
4. DONE - what to do with the rejected items info
5. fallacies end of list function not working regression
6. Cannot convert undefined or null to object
7. DONE - Cannot read property 'q' of undefined
8. DONE - #47 fix the icons
9. #55 Create ink to Wikipedia on the details page
10. Redirect to data uri value

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

### #10 Redirect to data uri value

Steps to reproduce?

error: "Redirect to data uri value"
headers: HttpHeaders {normalizedNames: Map(0), lazyUpdate: null, lazyInit: ƒ}
message: "Http failure response for https://radiant-springs-38893.herokuapp.com/api/detail/Anthropomorphism%20orpersonification/en/false: 300 Multiple Choices"
name: "HttpErrorResponse"
ok: false
status: 300
statusText: "Multiple Choices"
url: "https://radiant-springs-38893.herokuapp.com/api/detail/Anthropomorphism%
