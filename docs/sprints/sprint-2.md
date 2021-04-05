# Sprint 2

- Non-adaptive choice switching uri
- Cannot read property 'includes' of null
- detail pages lead to general description, not a detail (done?)
- what to do with the rejected items info
- fallacies end of list function not working regression
- Cannot convert undefined or null to object
- #47 fix the icons
- #55 Create link to Wikipedia on the details page
- Redirect to data uri value
- Cannot read property 'q' of undefined (done)

## Sprint 3 planing

Start: April, 2021.

Goal:

1. export the list
2. order the list

I really wanted to order the list first, but exporting is more helpful to the project in general. Most people would be using this app to generate content for whatever LMS/LRS they are using. If a school uses Canva for it's LMS, and a custom backend LRS, then we should be able to export to those formats. Getting data back via an LRS would impact the order of the list, the app could also be used to substitute for a part of the ecosystem.

Canva and Moodle should all take class material in a tab or comma delineated format.

A full workflow would be:

1. create a category
2. edit the content for inclusion
3. show the list with an order based viewing/testing
4. see statistics for progress

Before all this, probably the next sprint should be finishing off everything not working from the last sprint. Those tasks look like this:

If this can all get sorted, then, yes, exporting might need to be next. It's actually a toss up between creating an order for the list export. Ordering just according to the number of detail views might be doable pretty quickly. But so would search.

## Redirect to data uri value

Steps to reproduce?

error: "Redirect to data uri value"
headers: HttpHeaders {normalizedNames: Map(0), lazyUpdate: null, lazyInit: ƒ}
message: "Http failure response for https://radiant-springs-38893.herokuapp.com/api/detail/Anthropomorphism%20orpersonification/en/false: 300 Multiple Choices"
name: "HttpErrorResponse"
ok: false
status: 300
statusText: "Multiple Choices"
url: "https://radiant-springs-38893.herokuapp.com/api/detail/Anthropomorphism%

## fix the icons

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
