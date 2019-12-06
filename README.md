# khipu

This project was generated with [ngX-Rocket](https://github.com/ngx-rocket/generator-ngx-rocket/)
version 7.1.0

## Table of contents

* [Project brief](#project-brief)
* [Observable Store Pattern](#observable-Store-Pattern)
* [Implement categories from a static list](#implement-categories-from-a-static-list)
* [Ffetch a list of wikidata items for the selected category](#fetch-a-list-of-wikidata-items-for-the-selected-category)
* [Get the page of wikipedia for the category and parse it for the list](#get-the-page-of-wikipedia-for-the-category-and-parse-it-for-the-list)
* [Merge the two lists](#merge-the-two-lists)
* [Create a detail page for a selected item](#create-a-detail-page-for-a-selected-item)
* [Create a form to enter a new category](#create-a-form-to-enter-a-new-category)
* [Determine the wikidata query to get a list of those items](#determine the wikidata query to get a list of those items)
* [Add the category to the category list](#add-the-category-to-the-category-list)
* [Creating the app](#creating-the-app)
* [AD B2C Implicit Grant Flow](#aD-B2C-Implicit-Grant-Flow)
* [The Service Worker](#the-Service-Worker)
* [Original README](#original-README)


## Workflow

Here is a brief of the CLI commands for using the project.
```
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
```

## Project brief

This project is to create a tool that can be used in e-learning to automatically generate lists of items from Wikipedia.
These list can then be exported and used by educators in their favorite e-learning application such as Moodle or Canvas.

I have implemented most of the functionality in various projects using a variety of methods in both Angular and React so I have some example implementations of features needed for this project.

Create a new feature branch for each issue and include the issue number in each commit.  Add API comments to all classes and functions.

The basic view components will be:
```
Categories
Items
Details
Options
```

Use the Observable Store Pattern detailed below to manage the state of the app as a replacement for state management with Redux.

I will be playing around with the OAuth login which relates to what I am doing at work.

I will also doing the layout styles and theme.  The project is setup to use the Ionic UI components so you can create basic layouts using Ionic components such as list: https://ionicframework.com/docs/api/list


## Observable Store Pattern

There is a brief overview of the pattern [here](https://blog.angular-university.io/how-to-build-angular2-apps-using-rxjs-observable-data-services-pitfalls-to-avoid/)

And a fuller architecture based article using the above is [here](https://georgebyte.com/scalable-angular-app-architecture/)


### Some notes on the pattern

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
```
<li *ngFor="let candidate of (store.state$ | async).candidates">
```


Another article based on the above is [here](https://georgebyte.com/state-management-in-angular-with-observable-store-services/)



## Implement categories from a static list

Create a categories component to view the list.

A category has the following properties:
```
category
language
wdt
wd
```

The language should be the setting from the i18n selector pre-existing in the app.  There are two predetermined categories to start:
```
name=fallacies
wdt=P31
wd=Q186150

name=cognitive_bias
wdt=P31
wd=Q1127759
```

This project has a hardwired category of "cognitive biases" which has a lot of the other functionality that this project will require.

The lists will need to have pagination, with the number of items per page configured in an options page.  The initial categories list will be short,  so it's OK to wait until the items lists to implement this, but be aware that this will be part of the state.


# Fetch a list of wikidata items for the selected category

Create an Items component to display the list of items for a category.

Categories can be used to construct a sparql query can be created like this:
```
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
```
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


## Get the page of wikipedia for the category and parse it for the list

Parsing the Wikipedia category page can be done to create another list with more items (some duplicates) which are grouped by category.  I only have experience doing this with the particular "cognitive bias" category, so there may be some differences for other categories.


## Merge the two lists

Each list should retain a flag indicating which list they came from, and if they appear on both lists so they can be styled accordingly.


## Create a detail page for a selected item

Create a details page to show the details of an item selected.

An item can be used to get a detail page from Wikipedia.
Wikidata will also hold a list of languages available for each item.  This property can be used to get translated pages.

Detail pages also contain preamble icons with warnings which need to be captures and shown as collapsable icons under the description.
https://github.com/timofeysie/strumosa-pipe#the-items-api


## Create a form to enter a new category

This will just be a simple input to let the user enter a new category.  It will end up being a SPARQL query such as 'list of <category>' where <category> is a plural word such as "cognitive biases" or "fallacies".

The input will be then used for the next section to determine the code for the category.


## Determine the wikidata query to get a list of those items

Just as the category name of fallacies uses the wd=Q186150, cognitive_bias has wd=Q1127759.  The user should be able to enter a name and the app determine the Q<code> if it exists.

add the category to the category list

Add new categories to the list of categories.


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

That was from npm i.  and then:
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

That deleted all the node modules on this laptop!  Aliaksei Kuncevic said he freed up 7gigs of space with that.

Back to business, the redirect URL is set in Azure to 8080 which is the port when running the service worker, but during development server runs on 4200, the standard Angular ng serve go-to port.

Is there any reason they can't be the same?  Will it be different for Electron?



## The Service Worker

Working on the service worker setup right now.
```
ngsw-config.json
```

In the app.module.ts file:
```
ServiceWorkerModule.register('./ngsw-worker.js', { enabled: environment.production }),
```

But where is this file?  It's in the served source after running:
```
npm run serve:sw
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

Task                            | Description
--------------------------------|--------------------------------------------------------------------------------------
`npm start`                     | Run development server on `http://localhost:4200/`
`npm run serve:sw`              | Run test server on `http://localhost:4200/` with service worker enabled
`npm run build [-- --configuration=production]` | Lint code and build web app for production (with [AOT](https://angular.io/guide/aot-compiler)) in `dist/` folder
`npm run electron:build`        | Build desktop app
`npm run electron:run`          | Run app on electron
`npm run electron:package`      | Package app for all supported platforms
`npm test`                      | Run unit tests via [Karma](https://karma-runner.github.io) in watch mode
`npm run test:ci`               | Lint code and run unit tests once for continuous integration
`npm run e2e`                   | Run e2e tests using [Protractor](http://www.protractortest.org)
`npm run lint`                  | Lint code
`npm run translations:extract`  | Extract strings from code and templates to `src/app/translations/template.json`
`npm run docs`                  | Display project documentation and coding guides
`npm run prettier`              | Automatically format all `.ts`, `.js` & `.scss` files

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
