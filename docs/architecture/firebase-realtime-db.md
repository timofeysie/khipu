# Firebase Realtime DB

The firebase [realtime database docs](https://firebase.google.com/docs/database/web/structure-data?authuser=0) give these guidelines:

- data structure as flat as possible
- denormalization (split data into separate paths)

Our current database model used only to support the item list is:

```txt
khipu1
- categories
  - X0YFaM8hXHdm89FWEQsj0Aqhcln1
- items
  - X0YFaM8hXHdm89FWEQsj0Aqhcln1
```

This is what some pseudo json looks like:

```json
"items": {
  "<user-id>": {
      "<category-label": {
        "<item-label>": {
          "item-details-viewed-count": 0,
          "item-details-viewed-date": 814,
          "user-description": "blah blah blah",
          "user-description-viewed-count": 0
          }
        }
      }
    }
  }
},
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
```

The [realtime-db.service.ts](src\app\core\firebase\realtime-db.service.ts) file has all our CRUD functions.

When loading a new category, we get a list of items from Wikidata with the following structure:

```json
     "fallacies" : {
        "type" : "uri",
        "value" : "http://www.wikidata.org/entity/Q310486"
      },
      "fallaciesLabel" : {
        "xml:lang" : "en",
        "type" : "literal",
        "value" : "correlation does not imply causation"
      },
      "fallaciesDescription" : {
        "xml:lang" : "en",
        "type" : "literal",
        "value" : "phrase"
      }
    },
```

Preserving this structure means having to access values like this:

```html
item[category.name + 'Label'].value
```

The Wikipedia list is parsed from the markup so we create our own data model.

Now we have to decide what to save in the db that will either combine or keep these two types of lists separate.

A discussion of the data model can be found [in this file](docs\architecture\item-data-models.md). Here is what we came up with:

```ts
export interface Item {
  categoryType?: string;
  label: string;
  description: string;
  type: string; // is usually set to "literal"
  uri: string;
  binding?: any;
  metaData?: any;
  sup?: string[]; // supplemental references
  source?: 'Wikidata' | 'Wikilist';
}
```

It was decided a while ago to put the two together into this single item. The source attribute would tell where it comes from. However, it could appear on both lists. So, we would need a 'both' value to cover that. Not really ideal. I mean, what will it be used for? We don't really know. Really, we only need the labe, description and uri for a simple list.

Also, initially we wanted to make the api calls each time the user loaded the list to make sure the content is up to date. But this means a lot of extra network calls when most of the time they are not needed.

At this point, the prevailing idea is to just remove things we don't use, and take notes as we go along with things we would like to do in the future. Things like showing what has changed in a list, ie: items removed, items added, descriptions changed. They all would need their own specific solutions and UX anyhow, so they are not features we just want to throw in because we think they might be useful.

Anyhow, this is getting a little long now for a discussion of what to store in the db when first creating an item. We can always refactor and add features later.

It might be that if a user only wants to create a lesson plan to send to another app, we will never need to store it. But they may still want the option to save the list and then edit it to tighten up the content. That's what I would like to do as a student creating a study list. So really, without a clear idea of the future of the app, the simplest way forward remains the best approach.

Without further ado then, here is the new model:

```txt
"label": string,
"wikidata-description": string,
"wikipedia-description": string,
"item-details-viewed-count": 0,
"item-details-viewed-date": 814,
"user-description": "blah blah blah",
"user-description-viewed-count": 0
```

We might need to add things like difference versions of the labels, aliases, and who knows what. The flat structure is OK for now, because we will want all these values for the list. If we need to have different views that need different data, such as the detail view, then they should either nested so they can be retrieved without getting all the other info, or they should be on another table.

I'm thinking completely different tables would be best. In good microservice form, the list and the detail view could be completely different apps.

If it's a new list, then we want to choose a description for the user. Previously in this app we were only getting wikidata, so the description in most cases was not available. Now that we get the wikipedia list as well, pretty much all the items on the categories tried have descriptions, so that's less of an issue. But the pattern of waiting till a detail view is visited to save data which might be used later in the list also still might be relevant.

Since the wikipedia items are already Item instances, it just remains to either add the wikidata object, or modify it if the wikipedia list already has the same item.

All we really need to do is ignore the above and just add whatever description is there to the user-description, and then out current list will work fine. Glad we had this talk.

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

Questions: How do you like to structure your data?

I prefer to structure my data as...

1. A simple JSON tree.
2. Documents organized into collections.

Answer: Definitely number 1.

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

### Enable copy and past of descriptions

Text select is not enabled by default in Ionic. Trying these works in the browser, but not on the device:

```css
-webkit-user-select: text;
-moz-user-select: text;
-ms-user-select: text;
user-select: text;
-khtml-user-select: text;
-o-user-select: text;
cursor: default;
```

Using a textarea for now to get things going.

### Removing the label/aliases from the description

This section covers the [Issue \$35: Remove label text from default user descriptions and add tooltip with explanation](https://github.com/timofeysie/khipu/issues/35).

What we want here may be extremely difficult. Here is a difficult example from the first page of the fallacies category.

The "association fallacy" has the following wikidata description:

_An association fallacy is an informal inductive fallacy of the hasty-generalization or red-herring type and which asserts, by irrelevant association and often by appeal to emotion, that qualities of one thing are inherently qualities of another. Two types of association fallacies are sometimes referred to as guilt by association and honor by association._

With out current functionality, it becomes:

"an is an informal inductive fallacy of the hasty-generalization or red-herring type and which asse..."

But ideally should be something like:

"Qualities of one thing are inherently qualities of another."

The pattern to catch this particular description and transform it might be:

"an <label/alias> is <sub-type> of the <type> or <type/alias> and which asserts, by xxx, that"

There are more examples on the issue linked to above. They are each individually different grammatical type situations.

So obviously, we need some kind of natural language processing capability to perform this kind of functionality. Or we need to collect as many patterns as possible and deal with them all by hand. Either way, that's a lot of work when we can just let the user edit their own description.

For now we will just include an \* where words were removed and deal with this later.

### Foreign language learning support and the item details

Now that the item list has meta data stored in firebase and merged with the api results,
there might be another issue now with the languages. We don't have the item lists stored by language. My feeling is this is OK. The user has a native language, and shouldn't be storing the same list if a different language.

We want to support lists that have a item/translation, where the user description is actually a target language being learned. So for this, do we need to have the user description field typed by this target language? More importantly, how is this type of list going to be described?
