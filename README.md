# khipu

An e-learning project to work with Wikipedia content.

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

Please note this list is not complete. There are a number of issues opened and completed on the GitHub that are listed below.

Current work is ongoing for [Issue #25 Get the description of a detail page](#Issue-#25-get-the-description-of-a-detail-page). Rather than create links for all these in the table of contents, they should be deleted or moved somewhere else. Since we are creating a React app to do the same thing as this project, having the list of tasks to do is also an important part. So the documentation of the work done is also a priority.

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

## The Current App State

Currently, we have five rows in the local storage table.

1. credentials
2. language
3. theme
4. categories
5. itemDetails

We will need to add the current page range in the pagination. The options also include a setting for the number of items on a page.

We also want the app to load wherever it left off. This means storing the route and having the api responses and user modifications in stored so that if the user loads a category list of items page, the descriptions added or modified in the detail needs to be used for the slide out items.

[Add selected item to the store #27](https://github.com/timofeysie/khipu/issues/27).

This issue has some work in progress, and will be the starting point for this feature.

The current item result must be stored in local storage, as well as with firebase. Some planning is needed here, because we don't really want to be storing complete pages from Wikipedia here. Right now we are only getting Wikidata partial results, but these will be expanded to include more types of items.

The main thing is the description, the available languages, and possibly some other details which will help flow back into the entry in the category list.

For example, there are currently many items without descriptions. In this case, when the detail is visited, a portion of the description, such as the first 100 characters can be copied into a user description field.

After this, the user description will replace the description in the slide out under the item.

The user is encouraged to customize this by cutting and pasting from the long descriptions from various API call results that appear on the details page. They can write whatever they want there.

So back to step one, the chooses an item from the category items list. As well as the two api calls that get made

```txt
www.wikidata.org/wiki/Special:EntityData/\${c.qcode}.json,
https://radiant-springs-38893.herokuapp.com/api/detail/${c.title}/${c.language}/false`,
https://radiant-springs-38893.herokuapp.com/api/details/${c.language}/${c.title}
```

We need to also get the user description from a table on firebase. In order to make the association between the user description and the item description from the api results, we need to have a key value table. A direct lookup table (ie: flat data)? A items list with duplicate structure with the categories list? That way association is easy.

There are a few similar choices for firebase web apps.

1. Firebase Realtime Database
2. Cloud Firestore

### Cloud Firestore

_Use our flexible, scalable NoSQL cloud database to store and sync data for client- and server-side development._

### Firebase Realtime Database

_Store and sync data with our NoSQL cloud database. Data is synced across all clients in realtime, and remains available when your app goes offline._

There is page comparing [the two choices here](https://firebase.google.com/docs/database/rtdb-vs-firestore). The main frontend difference I saw was:

#### Data model

I prefer to structure my data as...

1. A simple JSON tree.
2. Documents organized into collections.

The only thing this project might be missing with the realtime db is sophisticated querying capabilities on local data when the user is offline.

The realtime database sounds slightly better choice for this project, so going with that.

The firebase [realtime database docs](https://firebase.google.com/docs/database/web/structure-data?authuser=0) give these guidelines:

- data structure as flat as possible
- denormalization (split data into separate paths)

Their example looks like this:

```json
{
  "chats": {
    "one": {
      "title": "Historical Tech Pioneers",
      "messages": {
        "m1": { "sender": "ghopper", "message": "Relay malfunction found. Cause: moth." },
        "m2": { ... },
        ...
      }
    },
    "two": { ... }
  }
}
```

The denormalization flat structure example is this:

```json
{
  "chats": {
    "one": {
      "title": "Historical Tech Pioneers",
      "lastMessage": "ghopper: Relay malfunction found. Cause: moth.",
      "timestamp": 1459361875666
    },
    "two": { ... },
    "three": { ... }
  },
  "members": {
    "one": {
      "ghopper": true,
      "alovelace": true,
      "eclarke": true
    },
    "two": { ... },
    "three": { ... }
  },
  "messages": {
    "one": {
      "m1": {
        "name": "eclarke",
        "message": "The relay seems to be malfunctioning.",
        "timestamp": 1459361875337
      },
      "m2": { ... },
      "m3": { ... }
    },
    "two": { ... },
    "three": { ... }
  }
}
```

If there is a two-way relationship between users and groups then things are more difficult. What is needed is an elegant way to list the groups a user belongs to and fetch only data for those groups. An index of groups can help a great deal here:

```json
{
  "users": {
    "alovelace": {
      "name": "Ada Lovelace",
      "groups": {
         "techpioneers": true,
         "womentechmakers": true
      }
    },
    ...
  },
  "groups": {
    "techpioneers": {
      "name": "Historical Tech Pioneers",
      "members": {
        "alovelace": true,
        "ghopper": true,
        "eclarke": true
      }
    },
    ...
  }
}
```

This duplicates some data so to delete Ada from the group, it has to be updated in two places. This is a necessary redundancy for two-way relationships.

_This approach, inverting the data by listing the IDs as keys and setting the value to true, makes checking for a key as simple as reading /users/$uid/groups/$group_id and checking if it is null. The index is faster and a good deal more efficient than querying or scanning the data._

Here is a sketch of what we want our database structure to look like using denormalization.

For categories, since we want the user to be able to create their own custom categories, the wd value wont work, so we will use the name, which may not be the same as the label.

```json
{
  "categories": {
    "fallacies": {
      "name": "fallacies",
      "label": "Fallacies",
      "language": "en",
      "wd": "Q186150",
      "wdt": "P31"
    },
    ...
  },
  "items": {
    "categories": ["fallacies"],
    "current-page": "",
    "details": {
      "Fallacy of composition": {
        "batchcomplete": true,
        "query": {
          "normalized": [
            {
              "fromencoded": false,
              "from": "Fallacy_of_composition",
              "to": "Fallacy of composition"
            }
          ],
          "pages": [
            {
              "pageid": 523043,
              "ns": 0,
              "title": "Fallacy of composition",
              "terms": {
                "label": ["Fallacy of composition"]
              }
            }
          ]
        }
      }
      ...
    }
  },
  "descriptions": {
    "fallacies": {
      "Fallacy_of_composition": {
        "item-name": "Fallacy of composition",
        "user-description": "It's a crazy world.  And any way you can skin it is your business."
      }
    }
    ...
  }
}
```

So you can see, since we have a connection between the lists, some duplicated data means changes to items might have to be done in more than one place. The items/details/fallacies/name has a corresponding entry in descriptions/fallacies/name. After details are viewed, their user-description will be set. This due to the fact that a lot of item lists on Wikidata don't have any descriptions, or their are misused fields that contain info such as category or type which is not helpful for our purposes.

The above is missing the kind of keys mentioned in the denormalization example

```json
{
  "users": {
    "alovelace": { }
    },
    ...
  },
  "groups": {
    "techpioneers": {
      "members": {
        "alovelace": true,
```

### The CRUD functions

Since there are three parts of the JSON so far, we will need three functions to add data to the firestore:

- writeCategories
- writeItems
- writeDetailDescriptions

The first one looks like this:

```js
writeCategories(category: Category) {
  const database = firebase.database();
  firebase
    .database()
    .ref('categories/' + this.userId)
    .set(categoriesToWrite, error => {
      if (error) {
        log.error('write failed', error);
      } else {
        log.debug('write successful');
      }
    });
}
```

For the item details, we don't want to store whole pages from Wikipedia, so just the description fields will do for now.

We man need to use the normalized/from field as the key for items. Does every item have that field? Why are we using the name "details", when something like "category-items" or "items-list" might be more appropriate?

```json
"items": {
  "categories": ["fallacies"],
  "current-page": "",
  "details": {
    "Fallacy of composition": {
      "batchcomplete": true,
      "query": {
        "normalized": [
          {
            "fromencoded": false,
            "from": "Fallacy_of_composition",
            "to": "Fallacy of composition"
          }
        ],
        "pages": [ ... ]
      }
    }
  }
}
```

For better or for worse, this is what it would look like currently:

```js
writeDescription(detail: any) {
  const database = firebase.database();
  firebase
    .database()
    .ref('items/details/' + detail.query.normalized.fromencoded)
    .set(detail);
}
```

The first time using the database there was this error:

```txt
TypeError: app_1.default.database is not a function
```

I believe this was because I had imported the wrong thing, mainly because I am still a little confused about which one I need to use:

This is the import for firestore:

```js
import 'firebase/firestore';
```

This is the import for the realtime database:

```js
import 'firebase/database';
```

If you recall, the later was chosen. But firestore is a cooler name, which is probably why I added that to the project by mistake. After actually adding the realtime db and using the right import, the error changed to this:

```js
ERROR Error: Uncaught (in promise): Error: PERMISSION_DENIED: Permission denied
```

This StackOverflow answer says: _change the rules so that the database is only readable/writeable by authenticated users:_

```js
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

Making this change in the console shows this message:

```txt
Your security rules are not secure. Any authenticated user can steal, modify or delete data in your database.
```

This doesn't make sense. It's users that are not authenticated who we don't want to change the data. The db is intended to be used by authenticated users!

The [docs on security point out](https://firebase.google.com/docs/database/security/get-started?authuser=0): _in Realtime Database, you might want to include a field that denotes a specific role for each user. Then, your rules can read that field and use it to grant role-based access._

Anyhow, after refreshing the app, the CategoriesStore.writeCategories() works, and we can now see the data in the data dashboard. Great! That was a lot easier that MySQL by far.

Next up, back to the docs to learn about the rest of the CRUD functions.

We will also need to create a sharable config function for creating the db. It's not clear how this is done, but hopefully that will be addressed somewhere in the docs.

#### Reading and writing to firebase

After implementing the "C" by creating the categories in the db successfully, it's time for the "R" part of CRUD. The write and create seem to be the same thing. Whatever was there previously will be overwritten with the newly created JSON. So this makes the read even more important. We want to know what is there before we modify it. This also brings up all sorts of concurrency questions for me. If I am using an app and a browser at the same time asynchronously, there could be issues if the time between read and write is extended.

[Here are the docs for that](https://firebase.google.com/docs/database/web/read-and-write?authuser=0)

set() overwrites data at the specified location, including any child nodes.

To read data at a path and listen for changes, use the on() or once() methods to observe events.

It appears as if we will have to manually differentiate users and store our category, items and details based on a user id. This is accomplished as follows:

```js
const userId = firebase.auth().currentUser.uid;
```

So our current JSON structure will work but will need this id in from of each object stored. As far as how this would affect the performance of a popular app, I'm doubtful. But since this app can be considered a demo of a future implementation, it's probably OK either to ignore user differences and let all the user share the lists and descriptions, or use the id to let each user have their own.

We will definitely need roles in the future, such as admin, teacher, student, parent, spectator. All this will need to be thought about as we go. This is an incremental development project. At each step we can gain more information that will inform where we are headed and the next steps on how to get there.

As an example of the possibility of using the user id in front of each object, here is what that might look like for the categories table:

```json
{
  "categories": {
    "<user-id>": {
      "fallacies": {
        "name": "fallacies",
        "label": "Fallacies",
        "language": "en",
        "wd": "Q186150",
        "wdt": "P31"
      },
      ...
    }
  },
```

This is what was decided upon in the end. It will be helpful to create test users with various test categories and not have to worry about affecting an account that is actually being used for study.

### Item statistics

Another thing we want is statistics about each category list and each item on the list. For example, every time an item short description is viewed, every time an item detail is viewed, we want to increment a counter, as well as what date the item was viewed. We also want to let the user indicate that they have committed an item to long term memory now, and it no longer needs to be on the list of things to be learned.

The reason for this is when a student is learning a list of things, they want to know how often they have studied a particular item. We will want to display some kind of indicator based on this information. It's kind of like a classic to do list with extra features.

This is where the xAPI/cmi5 comes in. cmi5 which appears to be a stripped down/focused use case of the xAPI. You can [read about xAPI and cmi5 here](https://xapi.com/cmi5/?utm_source=google&utm_medium=natural_search) and see a picture of the [whole ecosystem here](https://xapi.com/ecosystem/).

We also tried out some of the Javascript libs in [the Cades project](https://github.com/timofeysie/clades#trying-out-cmi5). The first three items on the checklist for what we would want this client to implement are:

1. Create Course structure
2. Add Assignable Units (AU) and Blocks to Course
3. Import Course into LMS (Learning Management System)

To support these features, we need a LRS (Learning Record Store) to send actions that happen in the Khipu app. For example, we want to send an xAPI statement to the LRS each time an item is viewed.

Then, this data needs to be retrieved to indicate on the list of items which items have been viewed and how many times, and especially highlight items that have never been viewed.

It is conceived that using [the Leitner system](https://en.wikipedia.org/wiki/Leitner_system#:~:text=The%20Leitner%20system%20is%20a,are%20reviewed%20at%20increasing%20intervals.) or some version of spaced repetition can create pacing through the list by removing items which have passed through a series of steps including being viewed, and tested for reading, writing, speaking, listening and possibly used in compound structures in the future.

For this reason, we don't want to include this state data in our firebase storage.

However, getting the LRS set up with xAPI/cmi5 reporting and querying is another rabbit hole of work. It would be so easy to add a counter to each item and increment it each time it's viewed. With that only, we could implement some viewed/un-viewed styles and think about how best to handle the UX we seek.

The other apps that got this far didn't really do a good job of this, so trying things out while the above is underway is a good idea.

## Observable Store Pattern

[Issue #12](https://github.com/timofeysie/khipu/issues/12) has been opened to apply this pattern to the list of items (Issue #4).

There is a brief overview of the pattern [here](https://blog.angular-university.io/how-to-build-angular2-apps-using-rxjs-observable-data-services-pitfalls-to-avoid/)

And a fuller architecture based article using the above is [here](https://georgebyte.com/scalable-angular-app-architecture/)

(Note: the following is old documentation before a refactor of into the features/category-item-details directory).

The categories directory can be the start of a feature directory which will hold the item list feature. This will include:

- create an items directory inside (with the observable state and presenter/container patterns)
- create a service with a RxJs subject
- create a container that uses the service to get the list of items
- create a presentation component to display data from the container communicating via @Input/@Output
- create a view class to sync with the state store via the router url

### Some previous notes on the pattern

https://en.wikipedia.org/api/rest_v1/page/summary/Basic_English#Word_lists

A service that uses the pattern might look like this:

```js
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

### Adding the description to the item in the item list

[This is issue #25: Get the description of a detail page and add it as the item list description](https://github.com/timofeysie/khipu/issues/25). It's a rabbit hole, since the user descriptions need to be persisted and applied later to the list. This required authentication, a database, and all kinds of functionality to support it.

Here are some of the related issues:

- #30 Create CRUD functions for the firebase realtime db
- #28 Setup firebase auth integration
- #27 Add selected item to the store
- #26 Add description edit form

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

### The description editor form

We should create a new component to handle the editing of the description field. I know it's only one field, but it will be good to keep that logic out of the simple display component.

We can specify the route starting after the app folder. The CLI command to do this:

```txt
ng g c features/category-item-details/item-details/components/description-form --module=features/category-item-details/category-item-details.module.ts
CREATE src/app/features/category-item-details/item-details/components/description-form/description-form.component.html (31 bytes)
CREATE src/app/features/category-item-details/item-details/components/description-form/description-form.component.spec.ts (692 bytes)
CREATE src/app/features/category-item-details/item-details/components/description-form/description-form.component.ts (309 bytes)
CREATE src/app/features/category-item-details/item-details/components/description-form/description-form.component.scss (0 bytes)
UPDATE src/app/features/category-item-details/category-item-details.module.ts (2052 bytes)
```

The docs on [reactive forms](https://angular.io/guide/reactive-forms) and [validation](https://angular.io/guide/form-validation) show everything that's needed for a simple form like this.

The commit under [issue #26](https://github.com/timofeysie/khipu/issues/26) shows the commit to make it happen.

Some extra things we need to do to support this feature are:

- Ionic content is not make for selecting fields. But we want it to be all selectable so that users can copy and pase anything from any page.
- We also want to listen to the enter key and use that to update the field rather than a submit button.

But these are small cosmetic tasks. There is a bigger problem now. The description field is currently markup, which is not text area editing-friendly. We can't just dump it into the description field for the form to edit when it looks like this:

```html
<div class="mw-parser-output">
  <table
    class="vertical-navbox nowraplinks hlist"
    style="float:right;clear:right;width:22.0em;margin:0 0 1.0em 1.0em;background:#f8f9fa;border:1px solid #aaa;padding:0.2em;border-spacing:0.4em 0;text-align:center;line-height:1.4em;font-size:88%"
  >
    <tbody>
      <tr>
        <td style="padding-top:0.4em;line-height:1.2em">
          Part of <a href="/wiki/Category:Au...
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

This one, automation bias is particularly difficult, as it actually has an image, and a lot of preambles that don't appear in other items, such as the entire table of contents for the series on automation. This doesn't really have a place in a description. Unless the preamble content is specifically about the contents of the description. I suppose it is OK in it's collapsable form, but will cause a layout issue when opened. I suppose if we have these at the bottom of the content, they can be expanded and the user can scroll down as far as they wat without destroying the main content.

Usually the description is the contents of the only <p> tag in all the markup. This wont work for automation bias, which has multiple <p> tags. There is no class name or id to identify the actual description. It looks like it just comes after the table.

The best thing would be to learn how to use the Wikipedia API to get that specific content. It's not a traditional API. It's also not like the Wikidata API that uses SPARQL as it's language of choice.

Anyhow, for now, we have a problem, and Issue #25: _Get the description of a detail page and add it as the item list description_ is ballooning out into a giant set of sub-tasks.

To allow the description to be edited, we need to get into how to update the store with actions, persist the changes, and allow a user to manage content they have created for their account, which includes a free guest account by default, and a premium account that will take care of all of that automatically.

That's a lot to do for what seems like a straight forward feature. But, it addresses a lot of issues that need to be solved for this to become a serious e-learning project.

### Wiki APIS

Before embarking on some hack to parse the html to get our description, a little search for Wikipedia APIs turns up a few links:

[This page provides an overview of the MediaWiki Action API.](https://www.mediawiki.org/wiki/API:Main_page). At the end in the section on _Other APIs_, there are two more links to check out.

[The MediaWiki Core REST API lets you interact with MediaWiki by sending HTTP requests to unique URLs](https://www.mediawiki.org/wiki/API:REST_API], including something about setting the User-Agent header.

This shows the API results that search results use to display additional information about articles, including a lead image and a description of the article's subject from Wikidata.

The [Hub](https://www.mediawiki.org/wiki/API:Web_APIs_hub) and the [search results page link](https://www.mediawiki.org/wiki/API:Page_info_in_search_results) look exactly like what we want. It says:

_The lead image comes from Extension:PageImages, which adds a page_image property to pages giving its guess as to an appropriate image for the page. The description comes from Wikidata, which maintains a localized description of the subject of each wiki page._

An example from [the sandbox](api.php?action=query&formatversion=2&prop=pageimages|pageterms&titles=Albert%20Einstein
https://en.wikipedia.org/wiki/Special:ApiSandbox#action=query&format=json&prop=pageimages%7Cpageterms&titles=Albert%20Einstein&formatversion=2) shows the usage of this call:

```url
https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages%7Cpageterms&titles=Albert%20Einstein&formatversion=2
```

```json
  "batchcomplete": true,
  "query": {
    "pages": [
      {
        "pageid": 736,
        "ns": 0,
        "title": "Albert Einstein",
        "thumbnail": {
          "source": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Einstein_1921_by_F_Schmutzer_-_restoration.jpg/38px-Einstein_1921_by_F_Schmutzer_-_restoration.jpg",
          "width": 38,
          "height": 50
        },
        "pageimage": "Einstein_1921_by_F_Schmutzer_-_restoration.jpg",
        "terms": {
          "alias": [
              "Einstein",
              "Einstein, Albert",
              "A. Einstein"
          ],
          "label": [
              "Albert Einstein"
          ],
          "description": [
              "German-born theoretical physicist; developer of the theory of relativity (1879–1955)"
          ]
        }
      }
    ]
  }
}
```

That's everything we need in one call, as promised. And it may not be blocked by CORS.
But when using the API for a fallacy, the response doesn't include anything like the above. So it is just Wikidata after all. Not the description content we need from Wikimedia:

```json
{
  "batchcomplete": true,
  "query": {
    "normalized": [
      {
        "fromencoded": false,
        "from": "Fallacy_of_composition",
        "to": "Fallacy of composition"
      }
    ],
    "pages": [
      {
        "pageid": 523043,
        "ns": 0,
        "title": "Fallacy of composition",
        "terms": {
          "label": ["Fallacy of composition"]
        }
      }
    ]
  }
}
```

There is more work to be done to get the parts of the Wikipedia page.

[This StackOverflow](https://stackoverflow.com/questions/8555320/is-there-a-wikipedia-api-just-for-retrieve-content-summary) answer has a good example. They use the title 'pizza', but switching that to a bias returns a lengthy page description using page title:

```url
https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=actor-observer_bias
```

Here is the response:

```json
{
  "batchcomplete": "",
  "query": {
    "normalized": [
      {
        "from": "actor-observer_bias",
        "to": "Actor-observer bias"
      }
    ],
    "redirects": [
      {
        "from": "Actor-observer bias",
        "to": "Actor\u2013observer asymmetry"
      }
    ],
    "pages": {
      "510995": {
        "pageid": 510995,
        "ns": 0,
        "title": "Actor\u2013observer asymmetry",
        "extract": "Actor\u2013observer asymmetry (also actor\u2013observer bias) explains the errors that one makes when forming attributions about the behavior of others (Jones & Nisbett 1971). When people judge their own behavior, and they are the actor ... (long description)."
      }
    }
  }
}
```

Or use pageids instead of the title there.

## Adding Firebase Auth

This app (Angular app) already is hosted on firebase. Using [the official guide](https://firebase.google.com/docs/web/setup?authuser=0) to enable authentication using Firebase, we also need to add Firebase to the web app to get it's Firebase configuration which looks like this:

```js
var firebaseConfig = {
  apiKey: 'AIzaSyBDeqGbiib0fVFoc2yWr9WVE4MV6isWQ9Y',
  authDomain: 'khipu1.firebaseapp.com',
  databaseURL: 'https://khipu1.firebaseio.com',
  projectId: 'khipu1',
  storageBucket: 'khipu1.appspot.com',
  messagingSenderId: '348969595626',
  appId: '1:348969595626:web:a3094e5d87583fca551d93'
};
firebase.initializeApp(firebaseConfig);
```

This looks like secret info but is OK to commit to the public repository. The apiKey in this configuration snippet just identifies the Firebase project on the Google servers. It is not a security risk for someone to know it. In fact, it is necessary for them to know it, in order for them to interact with the Firebase project.

There are four available ways to use Firebase JS SDKs:

1. from reserved Hosting URLs
2. from the CDN
3. using bundler with modules
4. modules for Node.js

We will off course use #3 via npm.

```txt
npm install --save firebase
```

Then it's time to [add email address and password sign-in](https://firebase.google.com/docs/auth/web/start?authuser=0) to the app.

```js
import firebase from 'firebase/app';
import 'firebase/auth';
```

Putting the firebase init call in the onInit lifecycle hook was causing this error:

```txt
core.js:4002 ERROR Error: Uncaught (in promise):
FirebaseError: Firebase: No Firebase App '[DEFAULT]' has been created - call Firebase App.initializeApp() (app/no-app).
...
LoginComponent.push../src/app/features/login/login.component.ts.LoginComponent.login (login.component.ts:60)
```

Just checking for umdefomed or null doesn't work. You have to check for this:

```js
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
```

Then, login appears to work, but we see this error:

```txt
logger.service.ts:107 [Login] Login error: TypeError: You provided 'undefined' where a stream was expected. You can provide an Observable, Promise, Array, or Iterable.
zone.js:3372 POST https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyBDeqGbiib0fVFoc2yWr9WVE4MV6isWQ9Y 400
```

The authentication service is working. The problem is the problem is how the service is used in the sprawling login function:

```js
async login() {
  this.isLoading = true;
  const login$ = this.authenticationService.login(this.loginForm.value)..
  const loadingOverlay = await this.loadingController.create({});
  const loading$ = from(loadingOverlay.present());
  forkJoin([login$, loading$])
    .pipe(
      map(([credentials, ...rest]) => credentials),
      finalize(() => {
        this.loginForm.markAsPristine();
        this.isLoading = false;
        loadingOverlay.dismiss();
      }),
      untilDestroyed(this)
    )
    .subscribe(
      credentials => {
        this.router.navigate([this.route.snapshot.queryParams.redirect || '/'], { replaceUrl: true });
      },
      error => {
        log.debug(`Login error: ${error}`);
        this.error = error;
      }
    );
}
```

The error message above comes from the log output in the error block.
_You provided 'undefined' where a stream was expected_

The login service API looks like this:

```js
login(context: LoginContext): Observable<Credentials> | any { ... }
```

It returns either of these:

- return of(data);
- return of(errorCode + ' ', errorMessage);

Seems OK to me, but obviously something is wrong. Without looking too much, this didn't work.

```js
return of(data) as Observable<any>;
```

Of is an RxJs operator. It's signature: of(...values, scheduler: Scheduler): Observable.

That should solve the second part of the error which says _You can provide an Observable, Promise, Array, or Iterable._

There seems to be a wide array of causes for this issue, ranging from providing the service in two different points, neglecting to return an Action in an NgRx Effect, returning different actions based on certain condition, an empty return, authenticate a user using JSON Web Token, wrong response type and on.

Seriously, these are all answers to [this StackOverflow question](https://stackoverflow.com/questions/47849258/typeerror-you-provided-undefined-where-a-stream-was-expected/50835027).

I'm pretty sure if I write my own login function, I can proceed. But that loses this lovely boilerplate code that has worked for me when using AWS cognito authentication. That b2cLogin function is still sitting there in the auth service file unused now.

And, the function is almost like poetry:

_forkJoin([...]).pipe(map(([...]) => credentials), finalize(() => {...}), untilDestroyed(this)).subscribe(credentials => {},error => {})_

I can imagine a chorus of Greek actors saying that like an ancient play. Or it's a magic incantation that Gandalf might teach to a young apprentice.

Moving on and ignoring the beautiful mess, we can create the simplest working solution and work incrementally from there. Everyone who learns Angular should know about [the official Tour of Heroes](https://angular.io/tutorial/toh-pt4) app. Using a service there goes something like this:

```js
this.heroService.getHeroes().subscribe(result => (this.heroes = result));
```

But there is something weird happening here, as we get this error:

```txt
TypeError: Cannot read property 'subscribe' of undefined
    at LoginComponent.<anonymous> (login.component.ts:89)
```

What? This function is called from the submit function, which is plenty of time for Angular to setup the service via dependency injection. Even if we check for the service to be truthy before subscribing, we are seeing this error in the service:

```txt
undefined result.next is not a function
```

In this case, BOTH blocks in the service get triggered. We see firebase success, AND firebase errors. What gives? I never get used to the continual problems we face as developers. Calling a service I have done a thousand times, but never had these issues. However, a main skill of a frontend developer is to get over it and move on trying to get a solution to the issue. Soon enough it will be working and I will be on with the next challenge and forget all about this.

One of the purposes of keeping these notes is to respect the process. It's easy to forget about the effort that went into something and later wonder what I did with my Saturday morning on December 12th, 2020. Now, there is a record of this. A kind of meta cognition that I can use to pace my development work with better planning and estimating.

OK, so next, I want to know why both of those errors are happening.

### Cannot read property 'subscribe' of undefined

Looking at a StackOverflow answer for a similar problem turns up this advice:
_The login method SHOULD NOT SUBSCRIBE. It should return either a Promise or an Observable._

This makes sense given that the previous code used an RxJs pipe.

http.get(…​) returns an Observable. With the subscription method shown in the Angular tutorial, we are subscribing to the observable and storing the results locally on the component. One reason not to do this is to use an async pipe in the template, and skip that overhead. But in this case, it's a login, so we actually want to do the navigate call on a successful login.

There is still a problem with the auth service login signature:

```js
login(context: LoginContext): Observable<Credentials> | any
```

This is shit. Any time you use the 'any' type, it's shit. Originally, the boilerplate code created by the veteran coders [Gaëtan Maisse](https://github.com/gaetanmaisse) and [Yohan Lasorsa](https://github.com/sinedied) looked like this:

```js
login(context: LoginContext): Observable<Credentials> {
// Replace by proper authentication call
```

Gaëtan is a developer at Leadformance as well as a teacher at Mines St Etienne, described on their website as one of the most prestigious engineering schools in France. Yohan is a Senior Cloud Developer Advocate at Microsoft.

These guys have a solid boilerplate that I have used before on the job and in production. What they mean by _proper authentication_ is up to us to determine however. If there is an error, we want the login form to display the message, so doesn't that mean either pass back either the credentials from a successful login, or an error if something went wrong? In our case, to get things working we used any to cover the error case, which could be a code and a message, just a message, or both glues together, or some specific error object. What would you do?

There is a good example of how to [use RxJs to use an http service](https://codecraft.tv/courses/angular/http/http-with-observables/). It is showing a search box, but you can see the itunes.search() service is used as part of an RxJs stream:

```js
  this.results = this.searchField.valueChanges
    .debounceTime(400)
    .distinctUntilChanged()
    .do( () => this.loading = true)
    .switchMap( term => this.itunes.search(term))
    .do( () => this.loading = false )
}
```

Let's give the [Tour of Heroes Error Handling section](https://angular.io/tutorial/toh-pt6#error-handling) a go to see what is the basic approach. It spells it out for us:

_To catch errors, you "pipe" the observable result from http.get() through an RxJS catchError() operator._

That may be true for an http call, but in this case, we are using the firebase code, which can be summarized like this:

```js
firebase
  .auth()
  .signInWithEmailAndPassword()
  .then()
  .catch();
```

If we create a return type for this function like this:

```js
firebaseLogin(context: LoginContext): Observable <any> { ... }
```

Then we see the Typescript error: _A function whose declared type is neither 'void' nor 'any' must return a value._

Both blocks 'then' and 'catch' blocks in the firebase function return 'of(user/errorMessage)', so this seems like we are returning a value. Unless we need a finally block. What would it being doing exactly?

Since this was just a test to see if a basic approach works, I think I will go back to making the original so-called poetic approach. This starts with the forkJoin. A definition please.

_forkJoin_ combines two subscriptions into a single one and returns an array of there results. It is extremely useful to use in ngOnInit when you need data from multiple sources before you can finish loading the component.

But just understanding the code doesn't help to understand the error at this point. A refresher:

_You provided 'undefined' where a stream was expected. You can provide an Observable, Promise, Array, or Iterable._

We are also seeing the then/catch blocks being executed in the firebase login function.

In the authentication.service, if we removed `return result.next();` from the 'then' block, then the catch block doesn't get triggered. So that's one of the issues. I can't really say it's solved because I'm not sure why that was there in the first place.

The problem was that even though it looked like we were returning something anything, it took reading [this comment from the great rapropos](vhttps://forum.ionicframework.com/t/cannot-read-property-subscribe-of-undefined-solved/87988), Ionic forum moderator where he said _Async validators must return a future (Promise or Observable). Yours is not returning anything._

Look at this:

```ts
login(context: LoginContext): Observable<Credentials> | any {
  this.setupFirebase();
  return firebase <-- this was missing
    .auth()
    .signInWithEmailAndPassword(context.username, context.password)
    .then((result: any) => {
      const data = {
        username: context.username,
        token: result.user.uid
      };
      this.credentialsService.setCredentials(data, context.remember);
      return result;
    })
```

Even though the results are being returned, the observable wasn't being returned. Adding that word fixed the login. Now it back to the backlog to see what comes next.

## Creating the app

These are the answers to the questions asked by the [ngX-Rocket CLI](https://github.com/ngx-rocket/generator-ngx-rocket/) when creating the app.

```txt
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

The proxy.conf.js file has been disabled. To enable it add this flag to the package.json scripts section:

```json
    "start": "npm run env -s && ng serve --proxy-config proxy.conf.js",
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
