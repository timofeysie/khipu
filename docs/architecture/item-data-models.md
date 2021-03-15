# Item Data Models

This is shared by wikidata and wikipedia items.
The wikipedia items have sup tags.
The category is the name of the whole subject.
The type is the way the wikipedia page has h2 and h3 titles.
The name of these sections is kept in the type.

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

## Wikidata item

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

## Wikipedia item

```html
<li>
  <a href="/wiki/Appeal_to_probability" title="Appeal to probability">
    Appeal to probability
  </a>
  – a statement that takes something for granted because it would probably be
  the case (or might be the case).
  <sup id="cite_ref-2" class="reference">
    <a href="#cite_note-2">[2]</a>
  </sup>
  <sup id="cite_ref-3" class="reference">
    <a href="#cite_note-3">[3]</a>
  </sup>
</li>
```

There could be a containing h2/h3 section title that attaches to each item.

### Item details business logic

The item detail store component is responsible for a few different things at this point, and needs to be organized a bit better to deal with them.

Case in point is the new feature to pre-fill blank user descriptions with a portion of the description from the details API response. We will need a new write method to write only that item details meta-data. There are a few places that need to do this, and it makes sense to do them all in one call instead of various calls to update the same object.

Right now we have two updates that need to happen if the current user description is blank. In either case, we increment the count of the number of times the details page has been viewed. If the user description is blank, then we pre-fill it with part of the description from either of the API results. Which one remains to be decided.

If we are checking the description each time, then we could do it all, but it seems strange to put this business logic in a function called fetchFirebaseItem(). What is the best practice here? Return the portion of the description from this function and then

## Item statistics & the list order

Another thing we want is statistics about each category list and each item on the list. For example, every time an item short user description is viewed and every time an item detail is viewed, we want to increment a counter, as well as what date the item was viewed. We also want to let the user indicate that they have committed an item to long term memory now, and it no longer needs to be on the list of things to be learned.

The reason for this is when a student is learning a list of things, they want to know how often they have studied a particular item. We will want to display some kind of indicator based on this information. It's kind of like a classic to do list with extra features.

The reasoning behind this is often called the Leitner method, or spaced repetition. Schools also casually implement this spaced repetition using reviews, a quiz and a other tests.

Using the xAPI method, we send a statement of activity to an LRS, and then query the LRS to get the info we need to present the items in need of review.

We also want to offer a simple list order, where the items at the top need to be reviewed, and the items at the bottom are well known.
