# CHANGE LOG

Change log for the Khipu app. This helps keep a running list of changes made for each version to aid commit messages and sprint retrospectives.

## Version 1.1.2

- Removed the dash to rename item-details-store.ts to item-details.store.ts
- Closes #54 converted links on detail pages to full urls
- Closes #64 cleaned up the event and used the raw category to description update
- Closes #58 fixed the end of list check for fallacies
- Added log numbers for realtime-db.service.
- Fixed the blank user description for first visit to "ad iram"

## Version 1.1.1

- Removed remaining unused functions from items.store.ts (theses were moved to categories-store.ts to support creating a list for add-category).
- Added category selector with pre-fill (Issue #51).
- Fixed the wikilist url created for the server call.
- Using the table functions to parse the cognitive bias Wikipedia page.
- Testing content with checkParent(item) && this.checkContent(item).
- #53 Finished parsing Wikipedia table format for the list of cognitive biases list.
- Detail pages lead to general description, not a detail fixed.
- #58 fallacies end of list function not working regression
- Cannot convert undefined or null to object fixed.
- Cannot read property 'q' of undefined fixed.
- #47 fix the icons. Still might have issues due to caching.
- #55 Create link to Wikipedia on the details page.
- Start using GitHub projects.

### Issues Closed

Parse edge cases for the cognitive biases Wikipedia #53

## Version 1.1.0 20/03/2021

- added uri and wikidataUri to item-meta-data
- added a new path for wikipedia-parsed items
- using the fetchDescription function in item details without modifying the description for now
  fixed the product titles
- removed some business logic from the items.component to make it dumb again
- re-instated the app-items component to display the list
- put the business logic where it belongs in the items-container
- removed pagination on the items list page until it's re-implemented

## Versions 1.0.x 2020/02/2021

All previous work before the change log was created. It included a more complex view based at first on just Wikidata items. Wikipedia-parsed items were added and while refactoring this file was considered necessary to keep up with the work being done.
