# The Add Category Feature

## Moving item.store functionality into the add category feature

We need to add a new sync pipe to get the result of the parsed wikidata into the add-category page after it has been loaded by tapping the "Load" button on the page.

ERROR TypeError: Cannot read property 'name' of undefined
at Object.eval [as updateRenderer](AddCategoryComponent.html:26)

It appears to be an array inside an array. So this works to fix the issue:

```ts
this.state.wikidataItemList = wikidataItemList[0];
```

But then when trying to add the wikipedia parsed list of items we are calling the wiki-list-items (bad inconsistent choice of names there) with the following:

```ts
this.state.wikiListItems = wikiListItems;
```

Wiki list Items:

```json
description: "a statement that takes something for granted because it would probably be the case (or might be the case)."
label: "Appeal to probability"
sectionTitle: "Formal fallacies"
sectionTitleTag: "H2"
uri: "/wiki/Appeal_to_probability"
```

Wikidata item list:

```js
fallacies: {type: "uri", value: "http://www.wikidata.org/entity/Q7162532"}
fallaciesDescription: {xml:lang: "en", type: "literal", value: "common misunderstanding of the mechanics of rocket flight"}
fallaciesLabel: {xml:lang: "en", type: "literal", value: "pendulum rocket fallacy"}
```

So here we have the clash of two different data models. What will happen on save is that they will be merged into this:

```ts
/**
 * This is shared by wikidata and wikipedia items.
 * The wikipedia items have supplemental (sup) tags.
 * The category is the name of the whole subject.
 * The type is the way the wikipedia page has h2 and h3 titles.
 * The name of these sections is kept in the type.
 */
export interface Item {
  label: string;
  description: string;
  type?: string; // is usually set to "literal"
  uri: string;
  categoryType?: string; // may not need this
  sectionTitle?: string; // wikipedia section titles
  sectionTitleTag?: string; // h2/h3, etc?
  binding?: any; // I don't think we need this
  metaData?: any; // user description and other meta data
  sup?: string[]; // supplemental references
  source?: 'Wikidata' | 'Wikilist';
}
```

After loading a set of lists, we can then enter edit mode, where the user could edit any descriptions from either of the sources.

Then, the user can choose to save and export the list. This edit more versus a saved mode is a new thing in this app. The first appraoch was to shove all the behavior into one list.

There is some crossover with this, as in the fields that will be editable later. The idea is that both have edit modes, but the lists are not stored on firebase until the user saves the list. It could be held in local storage. That should be on the to do list.
