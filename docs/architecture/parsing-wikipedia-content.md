# Parsing Wikipedia Content

After doing a bit of work to get the fallacies from the list of page, the next task is to also make it work for cognitive biases.

In the past, this was the first wikipedia page that was used, so there should be some code lying around that does just this. Currently, we get this error from the api:

```txt
error:
*: "See https://en.wikipedia.org/w/api.php for API usage. Subscribe to the mediawiki-api-announce mailing list at &lt;https://lists.wikimedia.org/mailman/listinfo/mediawiki-api-announce&gt; for notice of API deprecations and breaking changes."
code: "nosuchsection"
info: "There is no section 1 in List of cognitive bias."
__proto__: Object
servedby: "mw1281"
```

## Starting off with the firebase list

What we want is to remove any dependencies each source has on each other.

We should be able to just show the firebase list. The names are the key for the meta data object, and then the user-description is the slide out content.

When we then get the other lists like wikidata, and wikipedia results, we can add that info to the list.

In order to go to a detail page, we need the link which we get from wikidata.

It really depends now on the goal of the app.

If we just want a study list that will allow spaced repetition and aspect study (reading, writing, speaking, listening, combined, etc), then just the list is fine. The links to details can be determined on demand.

But if we want to let a teacher create a lesson plan from the content, then we will need the details view and all kinds of things to support that.

It's not just study lists vs. lesson plans. There is also the point of when the user first creates a category. This is the first time the calls are made, the results are stored, and the detail pages are only loaded on demand and not saved.

It's a nice to have feature that if the source material changes, we also want out lists to change. This is not essential however. That should be another feature.

For the lesson plan, the user has to visit all the detail pages. So we actually have four levels of functionality here:

1. a category is created, items are assembled from various api sources and saved to firebase
2. a category is updated, either by new items showing up in the api results, or the user visits a detail page
3. a lesson plan is created, all items are visited and all content converted to course materials and saved
4. a lesson plan is updated, data is refreshed and, what?

Number three and number four are not really scalable unless we don't store the content. Because a million users with large lists and details would max out any storage system.

Also, the last one also brings up the point of how we can refresh data and also update the user created data. An example here could help.

The user creates a list of items from a new category. They visit the detail page for the first item, and create a new truncated description from the available detail description.

The next time they visit the detail page, the source description has change because research has turned up new discoveries about the item. The user now has a user description based on out-dated information. We could flag that the description has changed, but often this will just adding citations, or refining words. The user might have to compare the changed verses their saved description to see for themselves what has changed.

We never intended to provide a diff of the two sources, but maybe we should. Like a version control system. That's a big feature even with libraries and tools available.

Another side effect of change detection would be that we would have to save everything in firebase. Or use wikipedia change detection. Which is?

Bear in mind, since we plan on exporting a list to Moodle for testing, it was expected that we would get feedback on how the list went, apply a spaced repetition algorithm and create a new list to export to Moodle for further tests.

But maybe we don't need to start with that. We start with export a static list.

Moodle takes care of it's own testing and spaced repetition and re-testing, and the app that created the original list never needs to know about it.

If Moodle provides the spaced repetition, or someone else does, that should be a pluggable feature.

We could make our own that will work in these situations. A cloud based serverless solution could work for both of these situations. Since we already have a hybrid of the above described features, the easiest way to go is to finish that off, implement the export feature, and then implement a spaced repetition module that can be used again by this app to get a new list. Or it can be used by a Moodle plugin to do it there.

In this way, even though we are creating two programs that use the same module, we can maximise usability.

Now, do we need the order for the initial list? I think so. We need to continue to allow the user to visit detail pages and refine their user descriptions. But allowing users to manually modify the order of the list, although a good feature, is not really part of the MVP.

As a personal incentive, having the list sorted by un-visited first (for learning purposes). So that is next, then export after. No attempt at detecting changes in the items. This means that we only need to get the results of the APIs once at the beginning, and then only update the firebase list when the descriptions are edited.

We really need to create a separate service to order the list, as this is part of the spaced repetition feature. So how does our current app interact with that?

We get a list of items from firebase. Then we sent those items to the cloud function, which then sends back the updated items. It will look at the meta data we are currently storing, but it could also receive LRS statements and provide the same service.

In addition to this, when a detail is visited, the order could be re-evaluated. Possibly this is not needed as it's actually nice to go back to the list in the same order it was when we left. If the item gets shoved down to the end of the list, and we go back, we will then be at the end of the list when we want to be ready to look at the next item in line.

OK, so the order will be a could function. That means we cover feature one, a user creates a list which is sent to the could function, and then the result is just the order of the items.

We might want to move the add category button to the categories page, and have that be the only place where fresh wiki API calls are made. Then, the current item.store only needs to get the firebase list and show that. Then the links to details are going to be the problem. We will have to add those to our firebase list.

OK. This has been a good talk. We have a plan of action now.

Move the current item.store functionality into the create category page. It will show the entire list in long long scroll. The user can then save that, and go about editing the list from the stored firebase list which is sorted by an external cloud function.
The order and details can be edited, etc.

One note about the wikilist sections, to get all the sections needed, first make the call without any section value so that the whole list (without descriptions) comes back. Then we can use that to inform the number of sections to get with full details available.
