# Sprint 1

It's about time this project had a bit more structure. Sprint retro/review/planning can all happen in one file here.

Start date
End date
Review
what went well?
What went poorly?
What actions to take.
Sprint planning: scope of sprint, all issues story-pointed, set a sprint target name.

March, April 2021.

Goal: parse the list of cognitive biases

Some of the issues closed during this sprint:

- #53 Parse edge cases for the cognitive biases Wikipedia
- #51 Add category selector with pre-fill
- #50 Merge and save lists added from the add category page
- #48 Load only the firebase list on the items list page
- #46 Include links to the detail pages to the meta data stored in firebase
- #45 Move list loading features from items.store to the add category page
- #44 parse the wiki-list api results for items
- #46 property 'value' of undefined at SafeSubscriber.\_next (item-details-store.ts:46)

Epics:

- Refactor items.store
- Integrate with wiki-lists

What went well/poorly/etc?

Refactoring the items store went OK. There is still some fat in the category store now, but it's still a work in progress.

Integrating with wiki-lists needed more unexpected changes, and moving all the parsing into the add category feature enabled that class to handle getting the data, and the items feature to get the saved list from the db.

# Sprint 0

January, February 2021.

### End of the sprint

As part of the [epic to add an order to the list](https://github.com/timofeysie/khipu/issues/42), first there was urgent need to refactor the item.store

This lead to a desire to see the fallacies list in action to make things more interesting. Thus the parse the wiki-list api results for items, issue #44 was begun about 30.

During this time the docs directory gained a new sub=-directory for architecture, and some of the content from the long readme was added to their own files, such as this one.

A long discussion on the firebase-realtime-db.md file led to more separation of concerns into load and save features accessed through a new FAB (fabulous action button) on the categories page which put our old add category feature to better use.

Now we can create the list of fallacies from wikidata and wikipedia, and create (overwrite) the list on Firebase. Yes, it's only loaded up for fallacies, but needs to be thought out more as to how to enter new categories and opposed to edit an existing category.

That, and the functionality from the item.store that was moved to add-category needs to be removed and that class now should only read the existing list from the db.

And then, there would be the little question of ordering and pagination. So, we've got a long way to go/ But the last thirty days have shown some good work with only a little time spent every evening plodding away at the issues raised on GitHub.

Oh, and milestones started getting put to use to try to tame the growing scope of this project. That's been another positive development.

One regression was that now [no icons at all show up on the app](https://github.com/timofeysie/khipu/issues/47). They went from working, except newly added ones, to fixed, then to none at all. Not sure how rocket handles the ionic icons, but it needs to be addressed. It wasn't high priority, but it's a blocker for a release, which needs to be done soon.

Commit message: closes #44 closes #45 closes #50 overwrite and save merged list of items working
