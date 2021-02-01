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

We may need to use the normalized/from field as the key for items. Does every item have that field? Why are we using the name "details", when something like "category-items" or "items-list" might be more appropriate?

```json
"items": {
  "<user-id>": {
    "categories": ["fallacies"],
    "current-page": "",
    "item-list": {
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

### Item list discussion

The paginated results for an item list call look like this:

```json
{
  "head" : {
    "vars" : [ "cognitive_bias", "cognitive_biasLabel", "cognitive_biasDescription" ]
  },
  "results" : {
    "bindings" : [ {
      "cognitive_bias" : {
        "type" : "uri",
        "value" : "http://www.wikidata.org/entity/Q16503490"
      },
      "cognitive_biasLabel" : {
        "xml:lang" : "en",
        "type" : "literal",
        "value" : "overconfidence effect"
      },
      "cognitive_biasDescription" : {
        "xml:lang" : "en",
        "type" : "literal",
        "value" : "bias in which a person's subjective confidence in their judgements is reliably greater than the objective accuracy of those judgements"
      }
    },
    ...
```

From this we have created a JSON object that looks like this:

```js
categoryType: 'cognitive_bias';
description: "bias in which a person's subjective confidence in their judgements is reliably greater than the objective accuracy of those judgements";
label: 'overconfidence effect';
type: 'literal';
uri: 'http://www.wikidata.org/entity/Q16503490';
```

This seemed like a good idea at the start, but maybe it's better to just store the result from the server, and get the values from that in the presentation class? If we create our own mapping and store data that way, we could be setting ourselves up later for problems with bad data. For example, if Wikidata changes this format somewhat, we would have to revisit all the items on the lists again and reload them.

If we however do this mapping in the presentation layer, there is just that to change to allow both old and new types and both types can co-exist together.

When you look at the advantage of doing the mapping in a template, it's clear that it is a better choice. But maybe we could have both.

For example, we want to at least add a user-description created on the detail page to replace the stock descriptions which are pitiful in many cases of they exist. We also want to add meta data regarding how many times an item description and detail have been viewed. This might be handled exclusively by our LRS reporting in the future, but for now, we will do it here.

To cover all bases, for the moment we will include _both_ models. We might even start using the type/value values to make a more responsive app once we start looking at more different kinds of content that make use of different types.

But, there is actually a problem. The item list is a paginated view of an API call. If we store only the items on the list, we still need to make the api call in case the results for a certain range have changed.  So what, do we have to change the ... what?  Forgot what I was getting at.

Since doing the work above to store the dual item list objects, we have a regression now.  The next page will be the same as the current page. Do we need to store the possibly the paginated views? If we do that, then an item is added, and another item moves to another slice of the list, there will be duplicates in the db.

This puts a big spanner in the pagination.  Store by pagination view, make the call and replace the old view with the new view.  The same with the next slice, and so on, propagating changes as they go from page to page.

Of course, we will have to copy over the old user created data such as the user-description to the new items if it exists there.

But wait, this poses a problem, as if an item is deleted, we may lose a user-description because there is no equivalent on the current page.

There seem to be two options now:

1. We could separate the user created data stored on a simplified object.
2. Remove the pagination from the API call, get all the items at once, and then do the pagination on the stored list instead.

At least with #2 we would have the total number of pages and allow a richer pagination experience, as well as an overview on the entire list for those interested.

Given the pagination issue, In either case I think we don't want anything on firebase items except user-description, counts, etc.  We can use the objects on the page views. #1 is a smaller change for now.

```json
"items": {
  "<user-id>": {
    "fallacies": {
    "current-page": "0",
    "total-pages": "0",
    "item-list": {
      "Fallacy of composition": {
        "user-description": "blah blah blah",
        "user-description-viewed-count": 0,
        "item-details-viewed-count": 0,
        "item-details-viewed-date": 1234556789
      },
      ...
```

Regarding the count, it might also be helpful to have the last viewed date there. Not sure if we need that just for description viewed. How about just for item-details-viewed for now.

This should avoid the pagination issue for now. We can get the meta data we want by creating a map of all the item-lists objects whose names will map to the items on the list returned from the paginated api calls, and can be used in some way in the display template.

The total pages can be updated as we go, until there are no more results. A little awkward until we discover a final solution, as there must be a Wikipedia/Wikidata method for this.

After trying this our, going to the next page erases the old page list. We need to add it.
Which means getting the list, adding the items from the next page, then writing the new combined list I think.

The items.store.getItemsFromEndpoint() function originally just loaded the list from the API call. Now, we want to first load the firebase list, then persist the user data from those items with the results of the API call paginated items. It seems like there is a kind of fundamental flawed with this setup, but I can't quite put my finder on it yet. When there is a better idea it can be refactored.

Right now, with this work in progress, the readUserSubData function is called twice, once to merge the firebase and the API results, and also before writing the new list. It doesn't need to happen the second time, which means we need a new write method.

The original write does a read before write.

The new method should only do the write.

Another issue with all this is how to get the user id which now rely on for each CRUD function. Just reading the id when the setupFirebase() function is called at the beginning of each operation does not seem to work. This is likely a asynchronous situation. The docs so far have not covered this issue.

If we get rid of the class user id member and just get the id each time an operation is done, we're all good. This seems redundant. The realtime-db.service is heading for a refactor, so this can be cleaned up as part of that. For now, this is what our combined items look like:

```json
{
  "categoryType": "cognitive_bias",
  "label": "overconfidence effect",
  "description": "bias in which a person's subjective confidence in their judgements is reliably greater than the objective accuracy of those judgements",
  "type": "literal",
  "uri": "http://www.wikidata.org/entity/Q16503490",
  "binding": {
    "cognitive_bias": {
      "type": "uri",
      "value": "http://www.wikidata.org/entity/Q16503490"
    },
    "cognitive_biasLabel": {
      "xml:lang": "en",
      "type": "literal",
      "value": "overconfidence effect"
    },
    "cognitive_biasDescription": {
      "xml:lang": "en",
      "type": "literal",
      "value": "bias in which a person's subjective confidence in their judgements is reliably greater than the objective accuracy of those judgements"
    }
  },
  "metaData": {
    "item-details-viewed-count": 0,
    "item-details-viewed-date": 814,
    "user-description": "bias in which a person's subjective confidence in their judgements is reliably greater than the objective accuracy of those judgements",
    "user-description-viewed-count": 0
  }
},
```

Only the metaData is stored in the firebase. Now we can go ahead and add a default user-description for those items that are missing them by filling the field with the beginning of the content from the item details API call. The user will also be able to edit, replace, whatever, and then see their preferred descriptions in the slide out component in the main list.

After making this change, and looking for the value in the template like this:

```html
{{ item.metaData['user-description'] }}
```

The first thing to notice is the snake-case, or kebab case, whatever you want to call it. When it comes to back end versus front end naming conventions, which wins out in this case?

Ignoring that issue which when settled may involve a complete db wipe, we now have missing descriptions showing up in the items list after having visited the detail for it. The next big problem is that it is overwritten the next time the item list is loaded.

The existing user-descriptions, userDescriptions, user_descriptions, need to be persisted after a new api call is done. Also, we don't want to do a write if the data has not changed.

1. persist user description
2. only write if the data has not changed

I wish now I had made a commit at this point with the above defects. Plowing ahead and trying to fix the bug where the description was being erased after visiting a different details, it all fell apart, and now we have no pagination and no descriptions at all. It's time to step through the essential functions and describe what each one is doing, and fix the parts that are not doing what they should.

So where does the old description get passed on?

1. ItemsContainerComponent in the constructor calls ItemsStore.fetchList(category, this.store.state.currentPage).

2. fetchList calls realtimeDbService.readUserSubData('items', category.name) to get the existingItems db items.

3. The getItemsFromEndpoint() is a big one.
   a. get the paginated item list from an API call
   b. go through each paginated item
   c. look for descriptions in the existingItems. These should replace anything the api returns.

Right now we save the merged list after this, but I'm not sure about this. Removing that lets visited detail item description show up back in the list.

Another question, in the getItemsFromEndpoint() function, we have the existing items, and incoming items.

It's weird because, even though we are setting the API description in the item, that property does not exist at the end of the function (all the other properties do). What gives? I guess that description is being erased later and never making it into the template?

No, the variable was being shadowed by a locally block scoped version. Have to pay attention to the orange squiggly underlines in the editor!

The next issue is the Baader-meinhoff Effect, which despite having a details page with descriptions, not of them get added to the item list page descriptions like some of the others that retain them.

And we do need to save the merged list if any items are not in the existing items list. Currently, new paginated views are not working.

### Setting the item detail user descriptions

After fixing part of [A details page with descriptions is not always added to the item list page descriptions](https://github.com/timofeysie/khipu/issues/33) this issue, we find that one of the API call which returns the text description is blocked by CORS.

This one works:
/api/detail/D%C3%A9formation_professionnelle/en/false

This one doesn't:
/api/details/en/D%C3%A9formation_professionnelle

Another problem is it takes quite some time to come back with an error. The first attempt was to call the second API when the first one failed, but because of the time delay, if the first description was not there, the user will have to wait for about 30 seconds before the second call is made and the result displayed. This doesn't always happen, but even with a spinner, that's not OK.

We could make both calls simultaneously, as was done before, but then we still need a way to set the user description from the second result if there is an error in the first. So you see the issue.

It seems like we want to do both calls if they are going to be returning different things. The example of the Albert Einstein page is an example of this.

It might be worth looking at the logs for the server to see why it's failing. That's on Heroku I believe.

229:46.422481 app[web.1]: Status Code: 400
230:16.387975 heroku[router]: at=error code=H12 desc="Request timeout" method=GET path="/api/details/en/D%C3%A9formation_professionnelle" host=radiant-springs-38893.herokuapp.com request_id=a932aa3e-ecae-4ae3-99c8-1c19c42a28ff fwd="103.111.178.105" dyno=web.1 connect=0ms service=30007ms status=503 bytes=0 protocol=https
230:17.840420 app[web.1]: singlePageUrl http://en.wikipedia.org/w/api.php?action=parse&section=0&prop=text&format=json&page=d%C3%A9formation_professionnelle
230:18.419087 app[web.1]: 5. WikiData item value re-direct?
230:18.428836 heroku[router]: at=info method=GET path="/api/detail/D%C3%A9formation_professionnelle/en/false" host=radiant-springs-38893.herokuapp.com request_id=c35d1670-c4fa-495c-8e93-0abaff45256b fwd="103.111.178.105" dyno=web.1 connect=1ms service=597ms status=200 bytes=11040 protocol=https
231:52.096801 app[web.1]: WIKIPEDIA_DETAILS https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=Déformation_professionnelle
231:52.186870 app[web.1]: WIKIPEDIA_DETAILS: Request Failed.

The item psychological pricing has this detail uri: /categories/item-details/cognitive_bias/Q419681

But looks like nothing from that page is in firebase. The SPARQL result uses LIMIT 9 OFFSET 18. So that's page three where every page is limited to 9. We should actually change to to 7. I hate having to scroll to see the whole list, and 'chunking' list is known to be psychological better than long lists.

That was another problem. The update list on firebase line was commented out because it was erasing the existing descriptions. The thing is we only want to save items if they exist from the api result but are not yet in firebase. Right now, since these are paginated views, that's not a problem until say, an item is added to a page at some point, and then possibly that whole page will be reset. I'm not sure what the solution to this is at this point.

Then, back to the error above, we can see the question: _WikiData item value re-direct?_

That redirect must be failing. Have to look at that code.

Also, since the call failed, but only after something other 30 seconds, the other call is then made, which works. The description there however is not being saved. Because now we need to refactor the code so that the get the-description-to-use functionality so that it can be shared between both results. However, one is an API text result, and another an HTML DOM element with usually very similar if not exactly the same content.

Waiting for the first API call to error out before making the second call is not working out. This thing is, the first call description takes priority as the default description. The second one needs to wait to confirm if this is not happening before then setting the user description with the first 100 characters of the DOM (after removing the markup of course).

Another feature request that was added recently has to do with this part of the code as well. Namely, the default user description taken from a Wikidata description needs to have occurrences of the label in the description removed.

For example:

```json
{
  "label": "Albert Einstein",
  "description": "Albert Einstein was a scientist who created the theory of Relativity."
}
```

Here, we would ideally remove the label "Albert Einstein" from the description along with the verb, such as "is" or "was". So then the default user description created from this should be "A scientist who created the theory of Relativity."

These two issues were opened to deal with this:

[Remove label text from default user descriptions and add tooltip with explanation](https://github.com/timofeysie/khipu/issues/35)

[When using the description as a question user should be warned if it contains part of the item label](https://github.com/timofeysie/khipu/issues/34)

There was a bit of confusion because we were using the db table key user-description when the app was expecting pascal case userDescription.

Now that the user description is showing up in the edit form, this is the next issue:

```txt
ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked. Previous value: 'placeholder: '. Current value: 'placeholder: An appeal to pity (also called argumentum ad misericordiam, the sob story, or the Galileo argument)...'.
```

http://localhost:4200/categories/item-details/fallacies/Q531873

ERROR TypeError: Cannot read property 'Q531873' of undefined
at SafeSubscriber.\_next (item-details-store.ts:43)
at SafeSubscriber.push../node_modules/rxj

After some network issues, this error showed up:

```err
ERROR TypeError: Cannot read property 'ecological fallacy' of null
    at ItemsStore.push../src/app/features/category-item-details/items/items.store.ts.ItemsStore.getItemWithDescription (items.store.ts:125)
    at items.store.ts:67
```

The existingItems had to be initialized for the current list. I think maybe I had paginated ahead while offline.

The fallacy of composition was not picking up the description back in the list. The result of this API:

https://radiant-springs-38893.herokuapp.com/api/details/en/Fallacy_of_composition

That's the wikimedia API call. It is called in the getWikidediaDescription. This service is called from the fetchWikimediaDescriptionFromEndpoint function.

The ItemDetailsStore class is a brittle string of functions passing each other too many arguments.

fetchDetails()
fetchDetailsFromEndpoint()
fetchDescription()
fetchWikimediaDescriptionFromEndpoint()
fetchFirebaseItemAndUpdate() or fetchDescriptionFromEndpoint()

So that's half the problem. The other part is that Fallacy_of_composition has everything thing it needs to get a description, and it can be seen in the firebase table, but there is no default description after visiting the details page as there should be. At one point I swear I saw the description pre-fill the edit description form. But now there is just this error:

_Expression has changed after it was checked._

The Wikipedia description is also the truncated one. It shouldn't be. It should of course be the full content.

For some reason the existingItems[Fallacy of composition].user-description is empty. Shouldn't it have the value from firebase?

The sticking point to having a better, looser coupled set of functions that get all the data needed for the details page is when adding the first default user description.

This means that the item in the wikidata list does not have a description. A log of the descriptions there, if they do exist, are in-appropriate for our purposes. For example, the fallacy "correlation does not imply causation" has the description "phrase".

Even if the descriptions were better, they still have to be stripped of the item label itself.

"Frequency illusion" which appears on the list as the "Baader–Meinhof phenomenon" poses another problem to this. It uses an alias in it's title which is actually the label. So if we remove the second occurrence, there will be a hole in the sentence. We could build up an array of grammar to exclude, such as ['the', 'a', 'also known as'] and exclude them along with the label. But we would then need new equivalents for every language we want to support, which is like all that Wikipedia does.

But, this may be acceptable. The user is going to want to edit these, and should at least check them for issues. So maybe this doesn't have to be perfect. Maybe we want to use a style for the first time a description is shown as coming from the default created by one of the descriptions available. Right now there could be three or none. We could show the text is orange with a note saying "Please check the description and edit it as needed. Do not include the label or aliases in the description."

To begin to refactor this class, we should be more clear on the possible sources for a default user description, as well as a possible user description which has already been set. We don't want to erase any content after it's been edited.

1. WikidataDescription (wikidata.org/wiki/Special:EntityData/qcode)
2. WikiMediaDescription (api/detail/id/lang/leaveCaseAlone)
3. WikipediaDescription (api/details/:lang/:title)
4. UserDescription (from firebase)

The first call is made directly from this app, and is not blocked by CORS. The next two api calls would be blocked, so we make the calls from the Conchifolia NodeJS server app and proxy the results for us. The third api above is created like this:

```url
https://${lang}.wikipedia.org/w/api.php?
  format=json&
  action=query&
  prop=extracts&
  exintro&
  explaintext&
  redirects=1&
  titles=${title}
```

The fourth data source is the Firebase realtime database cloud based no-sql service.

If there is a user description from the firebase call (#4), then we don't need to worry about it any more. So that happens first.

Get item meta data from firebase. If this contains a description, add that to the form to be edited.

If there is no description, we will try and get one from the three different api call results shown above (numbers 1 to 3). There should be used in the following order.

I think the or is:

- 4: Firebase
- 1: WikiData
- 2: Wikipedia
- 3: WikiMedia

Actually I'm not sure about the order of 2 or 3. They seem identical in most cases. I believe the Wikimedia has to have the html stripped from it, but apparently the server app is already doing it for us.

### Refactor the item.store service calls

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
  // check the existing items with the key in the incoming items and use that first,
  // get the incoming item key
  if (incomingItem[properties[0] + 'Label']) {
  incomingItemLabelKey = incomingItem[properties[0] + 'Label'].value;
  console.log('A');
  }
  if (existingItems && existingItems[incomingItemLabelKey]) {
  existingDescription = incomingItem[incomingItem[properties[1]].value];
  console.log('B');
  } else {
  needToSave = true;
  existingItems = [];
  console.log('C');
  }
  // otherwise use the incoming API description if there is one.
  if (incomingItem[properties[0] + 'Description']) {
  incomingItemDescription = incomingItem[properties[0] + 'Description'].value;
  console.log('D');
  }
  if (existingDescription && existingDescription.length > 0) {
  descriptionToUse = existingDescription;
  console.log('E');
  } else {
  descriptionToUse = incomingItemDescription;
  console.log('F');
  }
  const item: Item = {
  categoryType: properties[0],
  label: incomingItem[properties[1]].value,
  type: incomingItem[properties[1]].type,
  description: descriptionToUse,
  uri: incomingItem[properties[0]].value,
  binding: existingItems[incomingItemLabelKey],
  metaData: existingItems[incomingItem[properties[1]].value]
  };
  return { needToSave, item };
  }

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

### Foreign language learning support and the item details

Now that the item list has meta data stored in firebase and merged with the api results,
there might be another issue now with the languages. We don't have the item lists stored by language. My feeling is this is OK. The user has a native language, and shouldn't be storing the same list if a different language.

We want to support lists that have a item/translation, where the user description is actually a target language being learned. So for this, do we need to have the user description field typed by this target language? More importantly, how is this type of list going to be described?

### Item details business logic

The item detail store component is responsible for a few different things at this point, and needs to be organized a bit better to deal with them.

Case in point is the new feature to pre-fill blank user descriptions with a portion of the description from the details API response. We will need a new write method to write only that item details meta-data. There are a few places that need to do this, and it makes sense to do them all in one call instead of various calls to update the same object.

Right now we have two updates that need to happen if the current user description is blank. In either case, we increment the count of the number of times the details page has been viewed. If the user description is blank, then we pre-fill it with part of the description from either of the API results. Which one remains to be decided.

If we are checking the description each time, then we could do it all, but it seems strange to put this business logic in a function called fetchFirebaseItem(). What is the best practice here? Return the portion of the description from this function and then

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
