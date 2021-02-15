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
