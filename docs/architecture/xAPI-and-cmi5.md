# xAPI & cmi5

## Original xAPI & cmi5 notes

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
