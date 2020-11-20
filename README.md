# khipu

This project was generated with [ngX-Rocket](https://github.com/ngx-rocket/generator-ngx-rocket/)
version 7.1.0

## Table of contents

- [Workflow](#workflow)
- [Project brief](#project-brief)
- [Observable Store Pattern](#observable-Store-Pattern)
- [Implement categories from a static list](#implement-categories-from-a-static-list)
- [Fetch a list of wikidata items for the selected category](#fetch-a-list-of-wikidata-items-for-the-selected-category)
- [Get the page of wikipedia for the category and parse it for the list](#get-the-page-of-wikipedia-for-the-category-and-parse-it-for-the-list)
- [Merge the two lists](#merge-the-two-lists)
- [Create a detail page for a selected item](#create-a-detail-page-for-a-selected-item)
- [Create a form to enter a new category](#create-a-form-to-enter-a-new-category)
- [Determine the wikidata query to get a list of those items](#determine-the-wikidata-query-to-get-a-list-of-those-items)
- [Add the category to the category list](#add-the-category-to-the-category-list)
- [Creating the app](#creating-the-app)
- [AD B2C Implicit Grant Flow](#aD-B2C-Implicit-Grant-Flow)
- [The Service Worker](#the-Service-Worker)
- [Original README](#original-README)

## Workflow

Here is a brief of the CLI commands for using the project.

```txt
npm start // Run development server on `http://localhost:4200/`
npm run serve:sw // Run test server with service worker enabled on `http://localhost:4200/index.html`
npm run build [-- --configuration=production] // Lint code and build web app for production (with [AOT) in `dist/` folder
npm test // Run unit tests via [Karma](https://karma-runner.github.io) in watch mode
npm run test:ci // Lint code and run unit tests once for continuous integration
npm run e2e // Run e2e tests using [Protractor](http://www.protractortest.org)
npm run lint //  Lint code
npm run translations:extract // Extract strings from code and templates to `src/app/translations/template.json`
npm run docs //  Display project documentation and coding guides
npm run prettier
npm run electron:build   // Build desktop app
npm run electron:run     // Run app on electron
npm run electron:package // Package the app
http-server -p 8080 -c-1 dist // run the PWA (after a build)
firebase deploy
```

## Project brief

This project is to create a tool that can be used in e-learning to automatically generate lists of items from Wikipedia.

These list can then be exported and used by educators in their favorite e-learning application such as Moodle or Canvas.

I have implemented most of the functionality in various other projects using a variety of methods in both Angular and React so I have some example implementations of features needed for this project.

Create a new feature branch for each issue and include the issue number in each commit.  Add API comments to all classes and functions.

The basic view components will be:

```txt
Categories
Items
Details
Options
```

Use the Observable Store Pattern detailed below to manage the state of the app as a replacement for state management with Redux.

Use the presentation container pattern. Container components access the data store, and the presenter components uses Input/Output annotations to get and display data and pass user actions back to the container.

I will be playing around with the OAuth login which relates to what I am doing at work.

I will also doing the layout styles and theme.  The project is setup to use the Ionic UI components so you can create basic layouts using Ionic components such as list: https://ionicframework.com/docs/api/list

## Observable Store Pattern

[Issue #12](https://github.com/timofeysie/khipu/issues/12) has been opened to apply this pattern to the list of items (Issue #4).

There is a brief overview of the pattern [here](https://blog.angular-university.io/how-to-build-angular2-apps-using-rxjs-observable-data-services-pitfalls-to-avoid/)

And a fuller architecture based article using the above is [here](https://georgebyte.com/scalable-angular-app-architecture/)

The categories directory can be the start of a feature directory which will hold the item list feature. This will include:

- create a items directory inside (with the observable state and presenter/container patterns)
- create a service with a RxJs subject
- create a container that uses the service to get the list of items
- create a presentation component to display data from the container via @Input/@Output
- create a view class to sync with the state store via the router url

### Some previous notes on the pattern

ttps://en.wikipedia.org/api/rest_v1/page/summary/Basic_English#Word_lists

A service that uses the pattern might look like this:

```
onAddTodo(description) {
    this.todoStore.addTodo(newTodo)
        .subscribe(
            res => {},
            err => {
                this.uiStateStore.endBackendAction();
            }
        );
}
```

Smart components of the application where the store is injected do not have any state variables

Actions are methods made available by the stores.

Don't expose the subject directly to store clients, instead, expose an observable.  This is to prevent the service clients from themselves emitting store values directly instead of calling action methods and therefore bypassing the store.

The subject is an event bus.

It should be impossible to modify the state without notifying listeners about the change.

Split the state into smaller chunks. A good way to split the properties is to group them by feature and extract these groups into separate state objects, managed by corresponding stores.

There are two types of stores that emerge from splitting:
global stores that contain globally used state, (a singleton listed as a provider in a module)
component stores that contain the states used by a single component (not singletons, subscriptions must be cleaned up)

Proxy component with no biz logic can use the async pipe

```html
<li *ngFor="let candidate of (store.state$ | async).candidates"></li>
```

Another article based on the above is [here](https://georgebyte.com/state-management-in-angular-with-observable-store-services/)

## Issue #3: Implement categories from a static list

Create a categories component to view the list.

A category has the following properties:

```txt
category
language
wdt
wd
```

The language should be the setting from the i18n selector pre-existing in the app.  There are two predetermined categories to start:

```txt
name=fallacies
wdt=P31
wd=Q186150

name=cognitive_bias
wdt=P31
wd=Q1127759
```

This project has a hardwired category of "cognitive biases" which has a lot of the other functionality that this project will require.

The lists will need to have pagination, with the number of items per page configured in an options page. The initial categories list will be short, so it's OK to wait until the items lists to implement this, but be aware that this will be part of the state.

## Issue #4: Fetch a list of wikidata items for the selected category

Create an Items component to display the list of items for a category.

Categories can be used to construct a sparql query can be created like this:

```SQL
SELECT ?${category} ?${category}Label ?${category}Description WHERE {
    SERVICE wikibase:label {
         bd:serviceParam wikibase:language "[AUTO_LANGUAGE],${language}".
    }
    ?${category} wdt:${wdt} wd:${wd}.
}
LIMIT 1000
const url = wdk.sparqlQuery(sparql);
```

This will construct a url that will return a result with properties like this.

```json
"head":{
      "vars":[
         "fallacies",
         "fallaciesLabel",
         "fallaciesDescription"
      ]
   },
   "results":{
      "bindings":[
         {
            "fallacies":{
               "type":"uri",
               "value":"http://www.wikidata.org/entity/Q295150"
            },
            "fallaciesLabel":{
               "xml:lang":"en",
               "type":"literal",
               "value":"ecological fallacy"
            },
            "fallaciesDescription":{
               "xml:lang":"en",
               "type":"literal",
               "value":"logical fallacy"
            }
         },
```

Source: [the Strumosa pipe project](https://github.com/timofeysie/strumosa-pipe#the-items-api).  This is a NodeJS project hosted on Azure and works to get a list of items for a particular category.

However, I would like this project to create it's own API calls to Wikidata and Wikipedia, using a proxy if necessary to avoid CORS issues.  I would rather not have to maintain a server to support the app.

## Issue #5: Get the page of wikipedia for the category and parse it for the list

Parsing the Wikipedia category page can be done to create another list with more items (some duplicates) which are grouped by category.  I only have experience doing this with the particular "cognitive bias" category, so there may be some differences for other categories.

## Issue #6: Merge the two lists

Each list should retain a flag indicating which list they came from, and if they appear on both lists so they can be styled accordingly.

## Issue #7: Create a detail page for a selected item

Create a details page to show the details of an item selected.

An item can be used to get a detail page from Wikipedia.
Wikidata will also hold a list of languages available for each item.  This property can be used to get translated pages.

Detail pages also contain preamble icons with warnings which need to be captures and shown as collapsible icons under the description.
https://github.com/timofeysie/strumosa-pipe#the-items-api

I'm not sure about the routing for item details. It seems strange now to have categories as the root for it.

```txt
/categories/item-details/Q295150
```

The [Conchifolia details page](https://github.com/timofeysie/conchifolia/blob/master/my-dream-app/src/app/pages/detail/detail.page.ts) uses a backendApiService.getDetail(this.title,listLanguage, false) to get the details.

The only comment there is /api/detail/id/lang/leaveCaseAlone.

A sample item uri looks like this: http://www.wikidata.org/entity/Q295150

https://en.wikipedia.org/wiki/Ecological_fallacy

It could also look like this example from Conchifolia:
https://en.wikipedia.org/wiki/Actor-observer%20bias

Some reasons to get the wikidata page first is we get a list of available languages, and we get the exact url for the Wikipedia page. In the other projects, this was not a straight forward thing, as there were items that had different labels or different formats or would result in redirects. So to simplify that, parsing the wikidata page for the list of languages and Wikipedia uri links is a good idea.

Next, we used various Node server program to get around CORS issues for this. However, we don't want to have to maintain another app to do this. Also, we would have to pay for traffic if there ever was any. Using React Native was the only client that was able to handle the calls without issue.

### Steps for creating the details

[This is the issue](https://github.com/timofeysie/khipu/issues/7) for the details.

There is a list of what was done, and what is remaining on the issue.

### Still to do

1. Move the service operation into the item-detail.endpoint file.
2. Create a state for statistics on detail view to track activity.
3. Get a list of available languages and create a select in the header.
4. Replace the hard coded language settings with an item from the list based on the current language saved option.
5. Parse the Wikipedia page for sections and display the description.
6. Save the description in the state and use part of it as a slide in element in the category-items
7. Add interfaces for details.
8. Fix the unit tests.
9. Try a red-green-refactor session to start to build up unit test code coverage.

Item details has been a blocker, so all these things can happen now. Probably create some new issues to handle most of these.

For #1, a service was created to be shared for the category-item-details module. I wasn't feeling the need to have a separate endpoint file which acted as the service.

### Regarding languages

At first it seemed like we should get the language from the current state where the app strings will be translated as their bundle translations.

But we actually want to be able to support a foreign language student who has a native language and languages being learned. For this reason, we will need a different approach.

Each list potential could have it's own language setting so that the user would see the keys as one thing and the details as another. I can think of a few variations on this.

An item on a list of category items looks like this:

```js
export interface Item {
  categoryType?: string;
  label: string;
  description: string;
  type: string;
  uri: string;
}
```

We cam imagine the following situation: A student has a list of English words that they want to translate into French. If there is no language set already, then their current app languages settings can be used as their "default" or native language. The native language to target language is a special kind of relationship, but for now, we will skip that.

We will also want to track the number of times and dates each detail is visited. Do we want to combine the language chosen for the item detail with statistics about it? That means we also need to implement Firebase Oath login and a user preferences db table. This could be considered the start of a premium feature.

But we also want a free mode which will store the preferences in the local storage and rely on their PWA installation to keep track of their choices and stats. A nice free version would also let you export your settings and copy them into another installation of the app. Or better yet, keep track of their current state and let them access the same from various devices as a premium feature.

The problem with the premium feature is of course financial. If too many people want to use the app, then it starts to cost money which has to be passed along, and there is then a much longer todo list to support this.

So after this discussion, it seems like the starting point is just local storage. Put a language selector in the header for each item detail filled with the choices available in the wikidata file and store the choice. The first loaded choice will be from the app settings, and we will deal with what to do with changes later. For now just pretend like that's not an issue.

Thanks for listening, rubber ducky.

The options language setting is not in the local storage unless you make a choice on the options page. So the easy default is assume English unless there is a choice made there.

"Excès de confiance" exists in French, but the other items on the list just show the Q-code, and going to the detail page shows a blank screen, so we will also need a way to let the user know that there is no info in that language.

If you look at the results of the details call, we see 'fr' is not on the list.

id: "Q16948492"
labels:
ar: {language: "ar", value: "انحياز لللآلة"}
cs: {language: "cs", value: "Automation bias"}
en: {language: "en", value: "Automation bias"}
fa: {language: "fa", value: "سوگیری خودکارسازی"}
ja: {language: "ja", value: "自動化バイアス"}

sitelinks:
arwiki: {site: "arwiki", title: "انحياز للآلة", badges: Array(0), url: "https://ar.wikipedia.org/wiki/%D8%A ..."}
cswiki: {site: "cswiki", title: "Automation bias", badges: Array(0), url: "https://cs.wikipedia.org/wiki/Automation_bias"}
enwiki: {site: "enwiki", title: "Automation bias", badges: Array(0), url: "https://en.wikipedia.org/wiki/Automation_bias"}
fawiki: {site: "fawiki", title: "سوگیری خودکارسازی", badges: Array(0), url: "https://fa.wikipedia.org/wiki/%D8%B ..."}

Also there is a label in Japanese, but no link to a Wikipedia page. That's another issue.

So then, we want a list of languages available, do we have to merge these lists to get it? Is there a case where there is a link in Japanese, but no label?

We could show the available languages for the label and then say there is no Wikipedia page for it, but if there is a link for a language without a label, the user will never see that option.

Food for thought.

Another thing about the language select currently is that is lists the language abbreviation, and the item label itself translated into the language in question.

We could translate the code and just show the available language by mapping the code to an array of full text language labels. Give it some thought.

Also, the Ionic select is less than perfect. [This issue](https://github.com/ionic-team/ionic-framework/issues/18487) describes a bug with Windows desktop where you can't scroll. I can however use the keyboard arrows.

Also, the size is too small and difficult to change. Probably we want another page or our own custom select to replace this. The issue has been open for more than a year now so I can see nothing has changed at Ionic, which like many is a company masquerading as an open source project. No offence, as this is a good business model in my mind, but not so good for developers who need to leave the narrow path of working features.

Another issue is that the value of the select is not shown on page load. It would be nice to use it as the title on the header, as that works well once selected. Always more to do!

## Issue #8: Create a form to enter a new category

This will just be a simple input to let the user enter a new category. It will end up being a SPARQL query such as 'list of <category>' where <category> is a plural word such as "cognitive biases" or "fallacies".

The input will be then used for the next section to determine the code for the category.

## Issue #9: Determine the wikidata query to get a list of those items

Just as the category name of fallacies uses the wd=Q186150, cognitive_bias has wd=Q1127759.  The user should be able to enter a name and the app determine the Q<code> if it exists.

This task is to determine the API or SPARQL call needed to get the information needed (ie wd & wdt numbers needed) to then be used to get a list of items for the query.

It is expected that this is a kind of shot in the dark if the user does not already know that such a category list already exists. Even a Wikipedia page on the subject does not mean that it has a Wikidata equivalent list.

It will be helpful to run the SPARQL query for the user and show the some info about the call, such as error messages or number of items returned before the user can then add the category to the list to avoid adding dead categories.

## Issue #10: Add the category to the category list

Add the new category to the list of categories.

## Issue #25 Get the description of a detail page

An example that returns a json string with a description.

Here is the uri:

```uri
https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=Correlation_does_not_imply_causation
```

The result:

```json
{
  "batchcomplete": "",
  "query": {
    "normalized": [
      {
        "from": "Correlation_does_not_imply_causation",
        "to": "Correlation does not imply causation"
      }
    ],
    "pages": {
      "39834": {
        "pageid": 39834,
        "ns": 0,
        "title": "Correlation does not imply causation",
        "extract": "In statistics, the phrase \"correlation does not imply ... tests for causality, including the Granger causality test and convergent cross mapping."
      }
    }
  }
}
```

I hate how they use the id as the property. Anyhow, if you try to get that result in an Angular service, you will get the following error:

```txt
Access to XMLHttpRequest at 'https://en.wikipedia.org/w/api.php%20%20%20%20?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=Q295150' from origin 'http://localhost:4200' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

As noted before, React Native didn't have this problem. Otherwise we have used a node server app to make the call and send the results back to the client app in the browser.

We have done this a few different times. With vanilla JS, using TypeScript, following the NodeJS lengthy best-practices document, and also using serverless. They are all at different states of implementation. Time to see which one will be chosen to use here in the Khipu project.

- [Conchifolia](https://github.com/timofeysie/conchifolia) on Heroku in Vanilla JS.
- Quallasu on Azure
  The console will then show endpoints in the Service Information section.
- Calasaya on Azure, now defunct
- [Tiahuanaco](https://github.com/timofeysie/tiahuanaco) on AWS using the [serverless stack](https://serverless-stack.com/) docs and uses a dynamodb to store some results.

Conchifolia seems to have the most functionality. It deals with a lot of the redirect issues that you get when using the title. Using the Wikidata page which has the links for the Wikipedia pages in various languages should negate the need for a lot of that.

I say Vanilla JS, but the app is layered nicely with controllers, endpoints, models, routes and utilities.

It has the functionality we need to get descriptions, remove preambles and a lot of good stuff. So I think this is the one we will be trying to get working again. It works locally, but there is a server error reported from the host, so that needs to be fixed.

I spoke too soon about the Conchifolia node app being layered. It's all one file and very old school. A simple front end solution could be looked at for now.

### Description content

There are three main parts to the description content: preambles, description and references.

What I call the pre-ables are a group of icons that alert the user about such things as citations needed and problems in the content, etc. We want to move the icons to the bottom, hide the text and make them clickable.

The references could also be expandable somehow.

I'm wondering now about where to break up the description markup. Rather than adding crap onto the currently working server app, I gave a shot at creating a directive to put on the tag used like this:

```html
<p descriptionDirective [innerHTML]="description"></p>
```

However, it seems like, since the content is asynchronous, we can't really operate on it in the constructor. Then, to make matters worse, the onChange function doesn't get called. I guess it requires an input directive. We could listen for a DOM event. And which one would that be?

Suddenly the crappy Node app is starting to sound worth jumping in to. At least it can be used in any app, since we really should be writing this in React. It will come. For right now a demo of some of the functionality will help answer some UX questions about the whole enterprise.

Also, the directive approach is not idea because we not only want to show parts of the content, but use it in various ways. For example, the description will be used to make a map with the item - description using the ion-item-sliding component.

Then, the citations have icons, and we want to hide the text and make the icons clickable. And probably put them at the bottom.

The directive could still be used, for example in making the icons clickable.

Right now, the styles are not being observed. This behavior is normal. The class added to innerHTML is ignored because by default the encapsulation is Emulated. Which means Angular prevents styles from intercepting inside and outside of the component. We have to change the encapsulation to None, and then we can style the innerHtml content.

This works to just hide the unwanted content for now. You can always click on the link to go to the actual Wikipedia page.

The goal of getting the description in the app instead of a re-direct is so that it can be added to a slide out section in the item list. The best place to do this is where the data comes in from the API call and added to the store.

## Creating the app

These are the answers to the questions asked by the [ngX-Rocket CLI](https://github.com/ngx-rocket/generator-ngx-rocket/) when creating the app.

```
$ ngx new
          __   __
 _ _  __ _\ \./ / ____ ____ ____ _  _ ____ ___
| ' \/ _` |>   <  |--< [__] |___ |-:_ |===  |
|_||_\__, /_/°\_\ ENTERPRISE APP STARTER -~*=>
     |___/ v7.1.0
? What is the name of your app? khipu
? What kind of app do you want to create? Web app, Desktop app (using Electron)
? Do you want a progressive web app? (with manifest and service worker) Yes
? Which desktop platform do you want to support? (Press <space> to select, <a> to toggle all, <i> to invert selection)Windows, macOS, Linux
? Which UI framework do you want? Ionic (more mobile-oriented)
? Which kind of layout do you want? Side menu with split panels (more app-oriented)
? Do you want authentication? Yes
? Do you want lazy loading? Yes
? Do you want analytics support (with Angulartics2)? Yes
? What analytics provider are you using? Other
? Do you want additional tools? Prettier (automatic code formatting), Hads (markdown-based doc system), Jest (Delightful JavaScript Testing)
? Do you want additional libraries? Lodash (collection & general utilities), Moment.js (date management)
```

## AD B2C Implicit Grant Flow

Currently the redirect uri is set to jwt.ms which will just display the JWT and let you deconsctuct it.
Next, use the Capacitor Browser plugin to open the login dialog and redirect to extract the jwt from the redirected window which will involve changing the settings on the Azure portal.

Getting some kind of issue running currently:

```
/Users/tim/repos/khipu/node_modules/@angular/cli/bin/postinstall/analytics-prompt.js:8
(async () => {
       ^
SyntaxError: Unexpected token (
    at Object.exports.runInThisContext (vm.js:76:16)
    at Module._compile (module.js:542:28)
    at Object.Module._extensions..js (module.js:579:10)
    at Module.load (module.js:487:32)
    at tryModuleLoad (module.js:446:12)
    at Function.Module._load (module.js:438:3)
    at Module.require (module.js:497:17)
    at require (internal/module.js:20:19)
    at Object.<anonymous> (/Users/tim/repos/khipu/node_modules/@angular/cli/bin/postinstall/script.js:5:1)
    at Module._compile (module.js:570:32)
⸨                 ░⸩ ⠋ postinstall: info lifecycle @angular/cli@8.1.3~postinstall: Failed to exec postinstall script
```

That was from npm i. and then:

```
> npm run env -s && ng serve --proxy-config proxy.conf.js
The "@angular/compiler-cli" package was not properly installed.
Error: The "@angular/compiler-cli" package was not properly installed.
    at Object.<anonymous> (/Users/tim/.nvm/versions/node/v6.9.2/lib/node_modules/@angular/cli/node_modules/@ngtools/webpack/src/index.js:14:11)
```

The reason?

```
$ node --version
v6.9.2
QuinquenniumF:khipu tim$ nvm use 12
Now using node v12.9.1 (npm v6.10.2)
```

The reason I had to run npm i again was that to clear disk space I had run:

```
find . -name "node_modules" -type d -prune -exec rm -rf '{}'+
```

That deleted all the node modules on this laptop! Aliaksei Kuncevic said he freed up 7gigs of space with that.

Back to business, the redirect URL is set in Azure to 8080 which is the port when running the service worker, but during development server runs on 4200, the standard Angular ng serve go-to port.

Is there any reason they can't be the same? Will it be different for Electron?

## The Service Worker

Working on the service worker took a while to figure out a link to the file:

```
ngsw-config.json
```

Needed to be in the angular.json config. All the rest of the setup was complete.

The problem may have been due to an error when running:

```
ng add @angular/pwa --project my-app
Skipping installation: Package already installed
ERROR! ngsw-config.json already exists.
The Schematic workflow failed. See above.
```

After diffing a vanilla Angular project and adding the reference in the config file, the service worker is all good now.

In the app.module.ts file:

```
ServiceWorkerModule.register('./ngsw-worker.js', { enabled: environment.production }),
```

The service worker itself is in the source directory after running:

```
npm run serve:sw
```

To test the service worker in production the app must be hosted somewhere. Deployment from the master branch was done with Firebase like this:

```txt
m$ firebase init
     ######## #### ########  ######## ########     ###     ######  ########
     ##        ##  ##     ## ##       ##     ##  ##   ##  ##       ##
     ######    ##  ########  ######   ########  #########  ######  ######
     ##        ##  ##    ##  ##       ##     ## ##     ##       ## ##
     ##       #### ##     ## ######## ########  ##     ##  ######  ########
You're about to initialize a Firebase project in this directory:
  /Users/tim/repos/khipu
? Which Firebase CLI features do you want to set up for this folder? Press Space to select features, then Enter to confirm your choices.
Hosting: Configure and deploy Firebase Hosting sites
=== Project Setup
First, let's associate this project directory with a Firebase project.
You can create multiple project aliases by running firebase use --add,
but for now we'll just set up a default project.
? Please select an option: Create a new project
i  If you want to create a project in a Google Cloud organization or folder, please use "firebase projects:create" instead, and return to this command when you've created the project.
? Please specify a unique project id (warning: cannot be modified afterward) [6-30 characters]:
 khipu1
? What would you like to call your project? (defaults to your project ID) khipu
✔ Creating Google Cloud Platform project
✔ Adding Firebase resources to Google Cloud Platform project
🎉🎉🎉 Your Firebase project is ready! 🎉🎉🎉
Project information:
   - Project ID: khipu1
   - Project Name: khipu
Firebase console is available at
https://console.firebase.google.com/project/khipu1/overview
i  Using project khipu1 (khipu)
=== Hosting Setup
Your public directory is the folder (relative to your project directory) that
will contain Hosting assets to be uploaded with firebase deploy. If you
have a build process for your assets, use your build's output directory.
? What do you want to use as your public directory? dist
? Configure as a single-page app (rewrite all urls to /index.html)? Yes
? File dist/index.html already exists. Overwrite? No
i  Skipping write of dist/index.html
i  Writing configuration info to firebase.json...
i  Writing project information to .firebaserc...
✔  Firebase initialization complete!
QuinquenniumF:khipu tim$ firebase deploy
...
✔  Deploy complete!
Project Console: https://console.firebase.google.com/project/khipu1/overview
Hosting URL: https://khipu1.firebaseapp.com
```

## Original README

1. Go to project folder and install dependencies:

```sh
npm install
```

2. Launch development server, and open `localhost:4200` in your browser:

```sh
npm start
```

# Project structure

```
dist/                        web app production build
docs/                        project docs and coding guides
e2e/                         end-to-end tests
src/                         project source code
|- app/                      app components
|  |- core/                  core module (singleton services and single-use components)
|  |- shared/                shared module  (common components, directives and pipes)
|  |- app.component.*        app root component (shell)
|  |- app.module.ts          app root module definition
|  |- app-routing.module.ts  app routes
|  +- ...                    additional modules and components
|- assets/                   app assets (images, fonts, sounds...)
|- environments/             values for various build environments
|- theme/                    app global scss variables and theme
|- translations/             translations files
|- index.html                html entry point
|- main.scss                 global style entry point
|- main.ts                   app entry point
|- polyfills.ts              polyfills needed by Angular
+- setup-jest.ts             unit tests entry point
reports/                     test and coverage reports
proxy.conf.js                backend proxy configuration
```

# Main tasks

Task automation is based on [NPM scripts](https://docs.npmjs.com/misc/scripts).

| Task                                            | Description                                                                                                      |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm start`                                     | Run development server on `http://localhost:4200/`                                                               |
| `npm run serve:sw`                              | Run test server on `http://localhost:4200/` with service worker enabled                                          |
| `npm run build [-- --configuration=production]` | Lint code and build web app for production (with [AOT](https://angular.io/guide/aot-compiler)) in `dist/` folder |
| `npm run electron:build`                        | Build desktop app                                                                                                |
| `npm run electron:run`                          | Run app on electron                                                                                              |
| `npm run electron:package`                      | Package app for all supported platforms                                                                          |
| `npm test`                                      | Run unit tests via [Karma](https://karma-runner.github.io) in watch mode                                         |
| `npm run test:ci`                               | Lint code and run unit tests once for continuous integration                                                     |
| `npm run e2e`                                   | Run e2e tests using [Protractor](http://www.protractortest.org)                                                  |
| `npm run lint`                                  | Lint code                                                                                                        |
| `npm run translations:extract`                  | Extract strings from code and templates to `src/app/translations/template.json`                                  |
| `npm run docs`                                  | Display project documentation and coding guides                                                                  |
| `npm run prettier`                              | Automatically format all `.ts`, `.js` & `.scss` files                                                            |

When building the application, you can specify the target configuration using the additional flag
`--configuration <name>` (do not forget to prepend `--` to pass arguments to npm scripts).

The default build configuration is `prod`.

## Development server

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change
any of the source files.
You should not use `ng serve` directly, as it does not use the backend proxy configuration by default.

## Code scaffolding

Run `npm run generate -- component <name>` to generate a new component. You can also use
`npm run generate -- directive|pipe|service|class|module`.

If you have installed [angular-cli](https://github.com/angular/angular-cli) globally with `npm install -g @angular/cli`,
you can also use the command `ng generate` directly.

## Additional tools

Tasks are mostly based on the `angular-cli` tool. Use `ng help` to get more help or go check out the
[Angular-CLI README](https://github.com/angular/angular-cli).

## Code formatting

All `.ts`, `.js` & `.scss` files in this project are formatted automatically using [Prettier](https://prettier.io),
and enforced via the `test:ci` script.

A pre-commit git hook has been configured on this project to automatically format staged files, using
(pretty-quick)[https://github.com/azz/pretty-quick], so you don't have to care for it.

You can also force code formatting by running the command `npm run prettier`.

# What's in the box

The app template is based on [HTML5](http://whatwg.org/html), [TypeScript](http://www.typescriptlang.org) and
[Sass](http://sass-lang.com). The translation files use the common [JSON](http://www.json.org) format.

#### Tools

Development, build and quality processes are based on [angular-cli](https://github.com/angular/angular-cli) and
[NPM scripts](https://docs.npmjs.com/misc/scripts), which includes:

- Optimized build and bundling process with [Webpack](https://webpack.github.io)
- [Development server](https://webpack.github.io/docs/webpack-dev-server.html) with backend proxy and live reload
- Cross-browser CSS with [autoprefixer](https://github.com/postcss/autoprefixer) and
  [browserslist](https://github.com/ai/browserslist)
- Asset revisioning for [better cache management](https://webpack.github.io/docs/long-term-caching.html)
- Unit tests using [Jasmine](http://jasmine.github.io) and [Karma](https://karma-runner.github.io)
- End-to-end tests using [Protractor](https://github.com/angular/protractor)
- Static code analysis: [TSLint](https://github.com/palantir/tslint), [Codelyzer](https://github.com/mgechev/codelyzer),
  [Stylelint](http://stylelint.io) and [HTMLHint](http://htmlhint.com/)
- Local knowledgebase server using [Hads](https://github.com/sinedied/hads)
- Automatic code formatting with [Prettier](https://prettier.io)

#### Libraries

- [Angular](https://angular.io)
- [Ionic](http://ionicframework.com)
- [Ionic Native](https://ionicframework.com/docs/native/)
- [RxJS](http://reactivex.io/rxjs)
- [ngx-translate](https://github.com/ngx-translate/core)
- [Lodash](https://lodash.com)
- [Moment.js](https://momentjs.com)

#### Coding guides

- [Angular](docs/coding-guides/angular.md)
- [TypeScript](docs/coding-guides/typescript.md)
- [Sass](docs/coding-guides/sass.md)
- [HTML](docs/coding-guides/html.md)
- [Unit tests](docs/coding-guides/unit-tests.md)
- [End-to-end tests](docs/coding-guides/e2e-tests.md)

#### Other documentation

- [I18n guide](docs/i18n.md)
- [Working behind a corporate proxy](docs/corporate-proxy.md)
- [Updating dependencies and tools](docs/updating.md)
- [Using a backend proxy for development](docs/backend-proxy.md)
- [Browser routing](docs/routing.md)
