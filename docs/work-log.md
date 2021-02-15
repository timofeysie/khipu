# Work Log

This is the place for extra notes to make it easier to pick up where we left off after a break. You never know when you will be called back into the real world and by the time you come back. You might think keeping this level of note taking is excessive, and in most cases, that's true. Another purposes these notes serve is "rubber ducky" development. For this, explaining what's going on makes it a little clearer, and sometimes helps to solve issues.

## Issue #41 The first time the user visits the detail that has no description, the user description is not being added to the input field

ItemDetailsComponent has four inputs:

```ts
@Input() itemDetails: ItemDetails;
@Input() wikimediaDescription: any;
@Input() wikipediaDescription: any;
@Input() description: any;
```

However, the last three are undefined.

So then where are they coming from? As we have three fields being displayed on the details page.

Two properties get passed into the form:

```ts
[description] = 'description'[userDescription] = 'itemDetails.userDescription';
```

We only need one there. Which one is it? The first one is not used, so get rid of that.

Next, of the details page, there is a Wikimedia description.

That uses the wikimediaDescription value. So it being undefined is just until the async nature of the api calls being made.

Fallacy Correlation_does_not_imply_causation first had slide out user description of "Phrase"
Go to detail page, user-description edit field blank. No prefrill after details load.
Next, go back to list, then the following is in the slide out description:
"The inability to legitimately deduce a cause-and-effect relationship between two events or variables solely on the basis of an observed association"

To do: add tasks:

- add "create default description" button?
- add spinner and confirmation alert when description is updated.
