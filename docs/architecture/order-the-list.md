# Ordering the lists

## The order of the list (Issue #42)

Before implementing an actual LRS-based statistical feature, we want to explore a simple approach using just the order of the list.

The first idea for this order is based on:

1. how long ago the detail was viewed
2. the number of times its detail page has been viewed.
3. the number of times the slide out description has been viewed.

## Old notes on ordering the lists

So far, when a user clicks on a category, we make a wikidata call to get the items for that category. It was also paginated. Now that we also want to get the wikipedia page and parse it for items which we create from the markup, we need to start thinking about the order of the list.

It's not just as simple as some sort algorithm. The order will have to change in various ways. Items can be removed and added to the list manually. There is also the possibility that items can be added and removed from the wikidata or wikipedia source, and we need a way to deal with that.

We will also need to worry about the user descriptions that can be added for each item. But the situation is different from the wikidata user descriptions which are iffy. The Wikipedia descriptions are, as far as I know, complete for the two categories we have started with. It may not always be the case, so maybe this is not a real difference we should worry about.

If we knew the list was being loaded for the first time, we could just automatically copy the item description into the meta object to be written to firebase. In this case, the difference is right now, that we don't have to wait for the user to click on the item, go to the detail page which loads the wikipedia content for the item, and then we have a choice of what to set as the user description.

The reason that difference doesn't really matter is that the user will in this case see all those descriptions in the slide out content, so functionally, it should be the same, even though the performance is better in this case. So the answer for now is, no, don't set the user description on first load (which we have no concept of yet).

I guess the issue is that do we need the idea of the first load, refresh and check for changes? On Conchifolia, the reference app had a refresh button which would load the lists and do all the work whenever the user wanted that. But they had no user descriptions to worry about.

We will have to deal with this functionality in the future.

So it's another wormhole of work, but we also want to go in stages, and start with the simplest features first. What's really important in this prototype MVP is the range of features and how they work together which can later inform a super mature pattern for dealing with all the features we want.

But first, lets get a list of features on the table here.

Features

1. first load wikidata & wikipedia content
2. create an order for both merged lists
3. refresh and check for changes
4. load firebase category meta data list and map those to the result

The simplest part actually is just to add the wikipedia "wiki-list" items to the list, and let the operate the same way the current wikidata items operate. There is a bug right now where items that were say deleted on firebase get loaded again when the category is chosen from the list of categories but do not get added again to the firebase until a description is edited.

Even then, the other meta data don't get added. What would be a good next step after merging the lists is to fix this by looking to match the result item with it's wikidata items, and add the order number to that, so that the new ordered list will have only items that exist on firebase.

In that way, we fix the bug while adding a lot of functionality in one fell swoop. Wow, this went from being a deep wormhole of work into a big win! And I don't use exclamation marks often either. So, on with the parsing.
