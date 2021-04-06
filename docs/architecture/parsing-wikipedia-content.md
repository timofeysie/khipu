# Parsing Wikipedia Content

## list of cognitive biases parsing

This is the old favorite. But now that the Wikipedia parsing is geared for fallacies, the lost art of parsing the list of cognitive biases page is needed once more.

The first error after adding a select to load the category in the add-category page is:

```txt
core.js:4002 ERROR Error: Uncaught (in promise): TypeError: Cannot read property 'innerText' of undefined
TypeError: Cannot read property 'innerText' of undefined
    at CategoriesStore.webpackHotUpdate../src/app/features/category-item-details/categories/categories-store.ts.CategoriesStore.getItemsFromCognitiveBiasesList (categories-store.ts:174)
```

Comment out that and the next line and we get out Wikidata list of 91, but the doc fetched is: div.redirectMsg

```html
<div class="redirectMsg">
  <p>Redirect to:</p>
  <ul class="redirectText">
    <li>
      <a href="/wiki/List_of_cognitive_biases" title="List of cognitive biases"
        >List of cognitive biases</a
      >
    </li>
  </ul>
</div>
```

Maybe it's just a matter of adding underscores? This is the url:

Request URL: https://radiant-springs-38893.herokuapp.com/api/wiki-list/%20%20%20%20cognitive_bias/all/en

This is what it should be:

%20 is a space replaced by a + character which is encoded: _URL encoding converts characters into a format that can be transmitted over the Internet._

Time for a commit. Message: closes #51 #38 removed remaining unused functions from items.store and added category selector with pre-fill

Next, the parse.

Like getItemsFromFallaciesList(markup) in the categories.store, we need to try the same thing with getItemsFromCognitiveBiasesList().

It's still a redirect page right now.

[HttpCacheService] Cache set for key: "https://radiant-springs-38893.herokuapp.com/api/wiki-list/
cognitive_bias/all/en"
categories-store.ts:175 content <div class="mw-parser-output"><div class="redirectMsg"><p>Redirect to:</p><ul class="redirectText">

Why is there a CR in there? That's a CR in the code which causes that!

Next, do I have to say this again? A list of title is plural!

cognitive_biases/all/en

That should be in the category. It was, but the firebase version was still the singular. Edit that, and now we have our list! 141 beautiful cognitive biases to play with. Now we have a range of whole new items. The good news is that the fallacies parsing methods are working to get a lot of the descriptions there. Brilliant. Now we have more edge cases to log!

### Portal title with no description

There is just a portal name and no description.

```json
description: ""
label: "Psychology portal"
uri: "/wiki/Portal:Psychology"
wikidataUri: undefined
```

This one has an image tag as the title:

```json
description: "Society portal"
label: "<img alt="icon" src="//upload.wikimedia.org/wikipedia/commons/thumb/4/42/Social_sciences.svg/32px-Social_sciences.svg.png" decoding="async" width="32" height="28" class="noviewer" srcset="//upload.wikimedia.org/wikipedia/commons/thumb/4/42/Social_sciences.svg/48px-Social_sciences.svg.png 1.5x, //upload.wikimedia.org/wikipedia/commons/thumb/4/42/Social_sciences.svg/64px-Social_sciences.svg.png 2x" data-file-width="139" data-file-height="122">"
uri: "/wiki/File:Social_sciences.svg"
```

All the wikidata uri's will be undefined, so if you don't mind, I will leave that off for all the rest.

The markup for this section looks like this:

```html
<div
  role="navigation"
  aria-label="Portals"
  class="noprint portal plainlist tright"
>
  <ul>
    <li>
      <span
        ><img
          alt=""
          src="Psi2.svg/56px-Psi2.svg.png 2x"
          data-file-width="100"
          data-file-height="100"
      /></span>
      <span>
        <a href="/wiki/Portal:Psychology" title="Portal:Psychology">
          Psychology portal
        </a>
      </span>
    </li>
    <li>
      <span
        ><a href="/wiki/File:Social_sciences.svg" class="image">
          <img
            alt="icon"
            src="//upload.wikimedia.org/wikipedia/commons/thumb/4/42/Social_sciences.svg/32px-Social_sciences.svg.png"
            decoding="async"
            width="32"
            height="28"
            class="noviewer"
            srcset="
              //upload.wikimedia.org/wikipedia/commons/thumb/4/42/Social_sciences.svg/48px-Social_sciences.svg.png 1.5x,
              //upload.wikimedia.org/wikipedia/commons/thumb/4/42/Social_sciences.svg/64px-Social_sciences.svg.png 2x
            "
            data-file-width="139"
            data-file-height="122"/></a
      ></span>
      <span>
        <a href="/wiki/Portal:Society" title="Portal:Society">
          Society portal
        </a>
      </span>
    </li>
    <li>
      <span
        ><img
          alt=""
          src="//upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Socrates.png/18px-Socrates.png"
          decoding="async"
          width="18"
          height="28"
          class="noviewer"
          srcset="
            //upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Socrates.png/27px-Socrates.png 1.5x,
            //upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Socrates.png/36px-Socrates.png 2x
          "
          data-file-width="326"
          data-file-height="500"
      /></span>
      <span>
        <a href="/wiki/Portal:Philosophy" title="Portal:Philosophy">
          Philosophy portal
        </a>
      </span>
    </li>
  </ul>
</div>
```

Seems like we can just check if the parent div has a role of navigation, and then exclude that <ul>. Sounds like a plan.

Created the checkParent() function to do this and this one is done.

### Sub-list of as item

This one looks like a sub-list:

```json
description: ""
label: "List of maladaptive schemas"
uri: "/wiki/List_of_maladaptive_schemas"
```

There are a bunch of these:

```html
<li>
  <a
    href="/wiki/List_of_common_misconceptions"
    title="List of common misconceptions"
    >List of common misconceptions</a
  >&#160;&#8211; Wikipedia list article
</li>
<li>
  <a href="/wiki/List_of_fallacies" title="List of fallacies"
    >List of fallacies</a
  >&#160;&#8211; Types of reasoning that are logically incorrect
</li>
<li>
  <a
    href="/wiki/List_of_maladaptive_schemas"
    title="List of maladaptive schemas"
    >List of maladaptive schemas</a
  >
</li>
<li>
  <a href="/wiki/List_of_memory_biases" title="List of memory biases"
    >List of memory biases</a
  >&#160;&#8211; Wikipedia list article
</li>
<li>
  <a
    href="/wiki/List_of_psychological_effects"
    title="List of psychological effects"
    >List of psychological effects</a
  >&#160;&#8211; Wikipedia list article
</li>
```

We can skip all these. Is it OK to look for "list of"? No, that's not scalable.

"Wikipedia list article" however might work. For now it's enough. Created a function called checkContent(). Here is what the parsing function does now:

```ts
if (this.checkParent(item) && this.checkContent(item)) { ... continue ... }
```

If might be worth combining those. See how the other issues below turn out and condense them all later.

However, there are still two more that are not caught by this:

List of fallacies & List of maladaptive schemas.

So I guess it is OK to check for "List of" strings. We might think about keeping track of excluded items. Where does one keep track of nice to have features? An issue on GitHub? A todo list? It's really part of a larger feature which would allow a user to view the structure of a Wikipedia page in various list/notes brief and let them adjust the rules used to exclude and include content in their list/note.

That would be part of a grander user controlled parsing experience with content and/or markup on one side and the parsed content on the other side. So a micro-task for something that's brewing as a major feature is not really needed.

Time for a commit.

Commit message: #53 fixed the wikilist url and added parent and content checks for cognitive bias specific cases wip

### ISBN as title

It seems like references are a big problem and will solve a lot of issues.

```json
description: " J (1994). Thinking and deciding (2nd ed.). Cambridge University Press. ISBN 978-0-521-43732-5."
label: "ISBN"
uri: "/wiki/ISBN_(identifier)"
```

Somewhere around line 2400 in the sample markup:

```html
<div
  class="reflist reflist-columns references-column-width"
  style="column-width: 30em;"
>
  <ol class="references">
    <li id="cite_note-1">
      <span class="mw-cite-backlink">
        <b><a href="#cite_ref-1">^</a></b>
      </span>
      <span class="reference-text"> ...</span>
    </li>
  </ol>
</div>
```

So I think if it's an ordered list <ol> then we don't want it on the list.

It could go into the item model, but for now were no going to show them so we don't need to deal with references.

This check could be added to the parent check. Or the grand-parent.

It seems to work, but actually what should work seems to exclude all the content we want an just add abbreviations and unwanted item labels with no descriptions. I can't figure it out.

Then I realize it's actually a different end-of-list condition for this category.

So we have this thing called a checkForEndOfList() function. Check it out.

It wasn't as easy as that.

In checkContent, getting the ordered list great-grand parent length > 0 for example, we will have 46 items rejected for being a reference.

But they are the wrong items, as all we end up with is a list a few <ABBR> tags as titles, then the rest are titles with no descriptions. So that's not right.

Without this little detail, our stats during the parse look like this:

rejectedForNavigation 9
rejectedForReference 0
rejectedForCitation 15
rejectedForNoLabel 0
rejectedDuplicate 0
rejectedAsList 5

But looking at the actual list, it's not even starting off the way we expect it to, so it seems we have already excluded some content we need.

The first three items on the list in the sample file khipu/docs/examples/list-of-cognitive-biases.html when shown in a browser are:

```txt
Name: Agent detection
Type: False priors
Description: The inclination to presume the purposeful intervention of a sentient or intelligent agent.

Name: Ambiguity effect
Type: Prospect theory
Description: The tendency to avoid options for which the probability of a favorable outcome is unknown.[11]

Name: Anchoring or focalism
Type: Anchoring bias
Description: The tendency to rely too heavily, or "anchor", on one trait or piece of information when making decisions (usually the first piece of information acquired on that subject).[12][13]
```

None of these are on our list, which currently starts with "Affective forecasting"

This is actually in the "See Also" section which we are not interested in. Remember. anything after the "See also[edit]" section should be ignored, and the parsing halted.

And then the big moment when it is realized that the list of cognitive biases is in a set of tables, not unordered lists. That's why there was a deciding function.

Really however, instead of having a strategy pattern, we can just use the same loop to look for list items from each type.

That means excluding references, citations and abbreviations, etc, from both <ul> and <table> formats.

After creating the html element, this is what we are looking for:

```html
<tr>
  <td>
    <a href="/wiki/Agent_detection" title="Agent detection"> Agent detection</a>
  </td>
  <td>
    False priors
  </td>
  <td>
    The inclination to presume the purposeful intervention of a sentient or
    intelligent
    <a href="/wiki/Agency_(philosophy)" title="Agency (philosophy)"> agent</a>.
  </td>
</tr>
```

This table pattern goes name, type, description. The label we used in the name field can be found like this:

```ts
const name = tableDiv[0].getElementsByTagName('a')[0].innerText;
```

The type however has exceptions to the kind of data they hold.

The first type is a string:

```json
description: "The inclination to presume the purposeful intervention of a sentient or intelligent <a href="/wiki/Agency_(philosophy)" title="Agency (philosophy)">agent</a>.↵"
label: "Agent detection"
type: "False priors↵"
```

The second item type looks like this:

```html
<a href="/wiki/Prospect_theory" title="Prospect theory">Prospect theory</a>
```

We don't care about the reference for the type yet, so really we only want the contents of the anchor. Similar to the way we could get the name I suppose.

The same exception could happen for the name actually, when the item doesn't have it's own Wikipedia page to link to, it's just a string.

Then, the whole structure changes for the List of memory biases section, which has no type cell.

Currently, the descriptions for this section are not working. That's next.

Finding the end of the list is currently done by checking the length of table divs. If length returns 1, then we break to the outer loop. It works for now but makes some among us nervous.

Next, there are two more jobs to do.

One, remove markup from the descriptions. We already have these functions from previous work.

Next, get the uri from the label anchor href.

Then, the exceptions.

1. <SPAN> as title
2. [75] citation as title

And possibly more. First the references.

### Getting the uri

A sample label tag looks like this:

```html
<td>
  <a href="/wiki/Telescoping_effect" title="Telescoping effect"
    >Telescoping effect</a
  >
</td>
```

It's a simple as getting the href property.

Next, if we're happy with our list, it's time to save it. This is the error we will see:

```txt
AddCategoryContainerComponent.html:17 ERROR Error: Reference.set failed: First argument  contains an invalid key (Dread aversion
) in property 'items.X0YFaM8hXHdm89FWEQsj0Aqhcln1.cognitive_biases'.  Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"
    at index.esm.js:1514
```

That's because of the exception we forgot to deal with (#2):

1. <SPAN> as title
2. [75] citation as title

Let's look at the markup for these.

### <SPAN> as title

"<span id="Verbatim_effect">Verbatim effect</span>↵"

```html
<tr>
  <td><span id="Verbatim_effect">Verbatim effect</span></td>
  <td>
    That the "gist" of what someone has said is better remembered than the
    verbatim wording.
    <sup id="cite_ref-149" class="reference">
      <a href="#cite_note-149">&#91;149&#93;</a>
    </sup>
    This is because memories are representations, not exact copies.
  </td>
</tr>
```

### [75] citation as title

```txt
description: "After experiencing a bad outcome with a decision problem, the tendency to avoid the choice previously made when faced with the same decision problem again, even though the choice was optimal. Also known as "once bitten, twice shy" or "hot stove effect"."
label: "[75]"
type: "↵"
uri: "#cite_note-75"
```

From this markup:

```html
<tr>
  <td>
    Non-adaptive choice switching
    <sup id="cite_ref-75" class="reference">
      <a href="#cite_note-75">&#91;75&#93;</a></sup
    >
  </td>
  <td></td>
  <td>
    After experiencing a bad outcome with a decision problem, the tendency to
    avoid the choice previously made when faced with the same decision problem
    again, even though the choice was optimal. Also known as "once bitten, twice
    shy" or "hot stove effect".
  </td>
</tr>
```

We can see where the [7] comes from now. It's a similar problem in the case of the span.

It's not actually difficult to fix, as we can just use our removed HTML and remove potential citations, and that gives just the title as string needed.

This is looking like next sprints to-do list. Moving all these non-related discussions into the sprint 2 notes.

### Saving the merged lists

We get this error;

First argument contains an invalid key (Risk compensation / Peltzman effect) in property.

Now we have 109 Wikidata items and 197 Wikipedia items.

109 + 197 = 306

After the merge, we have 280.

## list of fallacies parsing

After doing a lot of work to parse the first section of the fallacies list, it turns out that we will have to start over in order to parse the whole list, and not worry about the sections. Before the decision was made to use the sections because we were not getting the descriptions we wanted from the full list. Now, after realizing how difficult it was going to be to get an arbitrary amount of sections to parse, and seeing that the full list does appear to have the descriptions we want, it's time to get the full list and do the work it takes to parse that.

The first item created using the old code which worked for section 1 looks like this:

```json
description: ".1 Improper premise"
label: "<span class="tocnumber">2.1</span> <span class="toctext">Improper premise</span>"
sectionTitle: "Formal fallacies"
sectionTitleTag: "H2"
uri: "#Improper_premise"
```

A copy of the markup from the call result is [here](docs\fallacies-all-wikidata-list.html).

An example of the first item is this:

```html
<li>
  <a href="/wiki/Appeal_to_probability" title="Appeal to probability">
    Appeal to probability
  </a>
  u2013 a statement that takes something for granted because it would probably
  be the case (or might be the case).
  <sup id="cite_ref-3" class="reference">
    <a href="#cite_note-3">&#91;3&#93;</a>
  </sup>
  <sup id="cite_ref-4" class="reference">
    <a href="#cite_note-4">&#91;4&#93;</a>
  </sup>
</li>
```

The current list for the first part currently looks like this:

```txt
2 Informal fallacies
2.1 Improper premise
2.2 Faulty generalizations
2.3 Questionable cause
2.4 Relevance fallacies
2.4.1 Red herring fallacies
```

So it's basically all wrong. The category (section title) is captured as formal fallacy when it's actually informal. This would be from the contents section.

Also, the description and label are switched.

First, rename the current functions to preserve the working section parsing functions in case we need to do that later for some reason.

Next, what is the structure that will let us know what are label-description pairs we want?

The surrounding div has class="mw-parser-output".

There is an H2 which signals the category. There is a div with role="note" and <P> tag with a description of the category. Having the category and it's description is nice to have, but not essential. It is also problematic for a simple list that we want.

The next section is a unordered list. It looks like we could just get these and be done with it. But there are other <ul> sections such as the id="toc" signifying the table of contents.

So we could get the id="toc" element and know that the next <ul> is the start of the content.

```html
<div id="toc">
  <h2>
    <div role="note">
      <p></p>
      <ul></ul>
    </div>
  </h2>
</div>
```

Not sure if we can count on this for the rest of the page, or other subjects, but it's the only structure we have right now.

Actually it was easier than that. Just looping the <ul> tags and then looping through the <li> tags within those, and getting the contents and then removing the label and the citations works to give us this:

Number of unordered lists: 83

And a long list of easily parsed labels and descriptions, from this:

Appeal to probability: a statement that takes something for granted because it would probably be the case (or might be the case).

There are a few problem items in the middle:

Ambiguous middle term: using a middle term with multiple meanings.

[21]: changing the meaning of a word when an objection is raised. Often paired with moving the goalposts (see below), as when an argument is challenged using a common definition of a term in the argument, and the arguer presents a different definition of the term and thereby demands different evidence to debunk the argument.

Then at some point, we get to the end of the list we want.

Is–ought fallacy: Ought fallacy – claims about what ought to be, on the basis of what is.

Then the end of the list starts off like this:

Lists portal: sts portal

On the web page, you can see it's the "See also[edit]" section. We don't want anything after this.

So next it's determine how to cut off the parsing, and then fix up the issues of the items that are not right.

Commit message: #44 #35 parsing label and description from wikipedia page wip

Issue #35 is: Remove label text from default user descriptions and add tooltip with explanation

Since we will be removing labels from descriptions here for the wikipedia parsing, it's related to that issue.

### Finding the end of the list

Everything after the "See Also" point should be discarded.

The ending section looks like this:

```html
<li>
  <a href="/wiki/Vacuous_truth" title="Vacuous truth">Vacuous truth</a>
  u2013 a claim that is technically true but meaningless, in the form no
  <i>A</i> in <i>B</i> has <i>C</i>, when there is no <i>A</i> in <i>B</i>. For example, claiming that no mobile
  phones in the room are on when there are no mobile phones in the room.
</li>
</ul>
<h2>
<span class="mw-headline" id="See_also">See also</span>
<span class="mw-editsection">
  <span class="mw-editsection-bracket">[</span>
  <a href="/w/index.php?title=List_of_fallacies&amp;action=edit&amp;section=11"
    title="Edit section: See also">
    edit
  </a>
  <span class="mw-editsection-bracket">]</span>
</span>
</h2>
<style data-mw-deduplicate="TemplateStyles:r936637989">
.mw-parser-output .portal {
  border: solid #aaa 1px;
  padding: 0;
}
```

It is easy to find the see also tag, but how to know where that is in the for loops? We can't. We would need a different mechanism to create the list, one that had a notion of what number it is during the list.

The easiest way right now is to look for this particular src attribute which is unique in the list:

```html
<span>
  <img alt="" src=
  "//upload.wikimedia.org/wikipedia/commons/thumb/2/20/Text-x-generic.svg/28px-Text-x-generic.svg.png"
  decoding="async"
</span>
```

That's as good as any at this point. We are going to have to provide the user with easy list editing tools, and one of these could be an end of list delimiter which would discard anything after a particular item.

This method appears to work. But the last item is not what is expected. In the example markup (/docs/fallacies-all-wikidata-list.html) we see this as the last item before the "See also" section.

Vacuous truth - a claim that is technically true but meaningless, in the form no A in B has C, when there is no A in B. For example, claiming that no mobile phones in the room are on when there are no mobile phones in the room.

But on the parsed list we are seeing:

Is-ought fallacy.

It might just be an ordering situation with out loops and breaking out. Not sure yet.

In any event, we are going to need a better way to determine the end of the list, but that can wait until we look at a few more categories to find one that will work for all of them.

### List within list

Next, the edge cases. Some of the items have citation numbers for labels, and some have descriptions made of up an entire sub-category. Case in point, equivocation.

The case in point looks like this:

```html
<li>
  <a href="/wiki/Equivocation" title="Equivocation">Equivocation</a>
  u2013 using a term with more than one meaning in a statement without
  specifying which meaning is intended.
  <sup id="cite_ref-FOOTNOTEDamer2009121_19-0" class="reference">
    <a href="#cite_note-FOOTNOTEDamer2009121-19">&#91;19&#93;</a>
  </sup>
  <ul>
    <li>
      <a
        href="/wiki/Ambiguous_middle_term"
        class="mw-redirect"
        title="Ambiguous middle term"
      >
        Ambiguous middle term
      </a>
      u2013 using a
      <a href="/wiki/Middle_term" title="Middle term">
        middle term
      </a>
      with multiple meanings.
      <sup
        id="cite_ref-FOOTNOTECopiCohen1990&#91;httpsarchiveorgdetailsintroductiontol00copipage206_206-207&#93;_20-0"
        class="reference"
      >
        <a
          href="#cite_note-FOOTNOTECopiCohen1990[httpsarchiveorgdetailsintroductiontol00copipage206_206-207]-20"
        >
          &#91;20&#93;
        </a>
      </sup>
    </li>
  </ul>
</li>
```

The initial solution to this was kind of reproducing the way the main list items are parsed. A recursive solution comes to mind as more elegant. But I'm sure we will all have a chance to revisit this again. Hopefully a wikipedia-first solution will emerge in the future and we wont need to worry about parsing content like this.

### The reference as label case

```html
<li>
  Definitional retreat u2013 changing the meaning of a word when an objection is
  raised.
  <sup id="cite_ref-Pirie2006_21-0" class="reference">
    <a href="#cite_note-Pirie2006-21">
      &#91;21&#93;
    </a>
  </sup>
  Often paired with moving the goalposts (see below), as when an argument is
  challenged using a common definition of a term in the argument, and the arguer
  presents a different definition of the term and thereby demands different
  evidence to debunk the argument.
</li>
```

This one shows up as:

```txt
label: [21]
definition: changing the meaning of a word when an objection is raised.  Often paired with ...
```

The definition is fine, but the label in this cas is not the contents of the anchor. I suppose the simple way to go here is to check if the anchor tag is the child of a <sup> tag.

It would be nice if whoever created the list could use a title attribute. But that only works if the label is a link to a detail page. In the case of "Definitional retreat", this is not the case.

It's a related term in the Motte-and-bailey fallacy on the Equivocation page with the link: "(see List of fallacies § Informal fallacies)" which is not going to help us.

After changing the parseAnchor function and calling it parseLabel, we are not getting titles, but seeing duplicates. There are two "baconian fallacy" items. We could (and should) make the list exclusive so that no duplicates are allowed, not not sure how feasible this is.

### Duplications

There is in fact duplicate items. As mentioned before, there are two "baconian fallacy" items. Looking at the list of items getting added the main array, we can see that the sub-item actually comes from the item itself.

```txt
...
new item Historian's fallacy
new sub item Baconian fallacy
new item Historical fallacy
new item Baconian fallacy
...
```

This is easier to fix than the other way around. If we wanted to use the oddly names JavaScript array function some() in the sub-item loop, then we have to pass the whole array there each time.

Trying out checking both item and sub-items on the whole array each time works. Then we only have 141 items instead of over 200, which indicates that this was actually a widespread issue which is good to have solved.

The code looks like this:

```ts
if (wikiList.some(thisItem => thisItem.label === newWikiItem.label)) {
  // skip adding duplicates
} else {
  wikiList.push(newWikiItem);
}
```

It's not good to have two blocks like that when we only need one. But this doesn't work:

```ts
if (wikiList.some(thisItem => thisItem.label !== newWikiItem.label)) {
  wikiList.push(newWikiItem);
}
```

In this case, none of the items will get added. Does anyone know how to do this in the most readable way? For now, it's working and time for a commit.

Before making the commit to fix this however I updated VSCode and then saw this error:

```txt
This syntax requires an imported helper named '__spreadArray' which does not exist in 'tslib'. Consider upgrading your version of 'tslib'.ts(2343)
```

The previously fine code is this:

```ts
wikiList.push(...subList);
```

The Stack Overflow solution: _Update tsLib dependency to get rid of the highlighting. In my case it was version 1.9.0. Update to 1.10.0 solved the issue._

How do you update a lib in VSCode? I note that we have version 1.9 in package-lock.

The code still compiles, so I have mixed feelings on this.

In the package lock, we see this:

```json
    "tslib": "^1.11.1"
  },
  "dependencies": {
    "tslib": {
      "version": "1.14.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-1.14.1.tgz",
    }
  }
```

New VSCode version 1.54.2. I'm not sure what it was before the updated.

npm install --save tslib

This seems to solve the issue.

### Truncated descriptions with dashes in the description

The is-ought fallacy, since it has a dash in it, is causing the description to be truncated.

I think it's because we are removing the first part of the the description which is actually the label. For example, the definition of "is-ought fallacy" is "-ought fallacy - claims about what ought to be, on the basis of what is." Obviously, we are failing at removing the label from the description here.

If we just remove the label, then three extra characters, it should be OK, right? Nope.

Another example is "Straw Man" which has a description "Straw Man fallacy - misrepresenting an opponent's argument ..."
So here, we would end up with the description starting with "Llacy - misrepresenting ...".

### A label with no description

After all the work to solve the above problems, this just showed up: "Correlative-Based Fallacies".

The markup for it looks like this:

```html
<tr>
  <th scope="row" class="navbox-group" style="width: 1%">
    <a
      href="/wiki/Correlative-based_fallacies"
      title="Correlative-based fallacies"
      >Correlative-based fallacies</a
    >
  </th>
</tr>
```

So how do we rule out that one?

Check if it's a <tr> first? How many places would that cover? I'm thinking that to really do this right is to create an interactive form that has options such as:

- list of ul.
- list table of cells
- list of whatever else the writer threw in

OK. Just add that to the list.

### Label with citation note

Just when it seemed we were finished, when trying to save the merged lists, we got this error from firebase:

```txt
[RealtimeDbService] error Error: Reference.set failed: First argument  contains an invalid key (Naturalistic fallacy fallacy[100] (anti-naturalistic fallacy)[101]) in property 'items.X0YFaM8hXHdm89FWEQsj0Aqhcln1.fallacies'.  Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"
```

There are two items in the list that relate to this error:

```txt
149:
label: "Naturalistic fallacy"
description: " inferring evaluative conclusions from purely factual premises in violation of fact-value distinction. Naturalistic fallacy (sometimes confused with appeal to nature) is the inverse of moralistic fallacy.↵"
uri: "/wiki/Naturalistic_fallacy"
wikidataUri: undefined
150:
label: "Naturalistic fallacy fallacy[100] (anti-naturalistic fallacy)[101]"
description: " inferring an impossibility to infer any instance of ought from is from the general invalidity of is-ought fallacy, mentioned above. For instance, is ↵  ↵    ↵      ↵        P↵        ∨↵        ¬↵        P↵      ↵    ↵    {\displaystyle P\lor \neg P}↵  ↵ does imply ought ↵  ↵    ↵      ↵        P↵        ∨↵        ¬↵        P↵      ↵    ↵    {\displaystyle P\lor \neg P}↵  ↵ for any proposition ↵  ↵    ↵      ↵        P↵      ↵    ↵    {\displaystyle P}↵  ↵, although the naturalistic fallacy fallacy would falsely declare such an inference invalid. Naturalistic fallacy fallacy is a type of argument from fallacy."
uri: "#cite_note-100"
wikidataUri: undefined
```

It's worth a look at the markup responsible for this is. There are actually five spots where the phrase 'naturalistic fallacy' occurs.

1. Mentioned as being the opposite of the Moralistic fallacy.
2. Similar to Appeal to nature.
3. As the inverse of moralistic fallacy.
4. Naturalistic fallacy fallacy[100] (anti-naturalistic fallacy)

```html
<li>
  <i>Naturalistic fallacy</i>
  fallacy
  <sup id="cite_ref-100" class="reference">
    <a href="#cite_note-100">&#91;100&#93;</a>
  </sup>
  (anti-naturalistic fallacy)
  <sup id="cite_ref-101" class="reference">
    <a href="#cite_note-101">&#91;101&#93;</a>
  </sup>
  u2013 inferring an impossibility to infer any instance of
  <i>ought</i> from <i>is</i> from the general invalidity of
  <i>is-ought fallacy</i>, mentioned above. For instance,
  <i>is</i>
  <span class="mwe-math-element">
    <span
      class="mwe-math-mathml-inline mwe-math-mathml-a11y"
      style="display: none"
    >
      <math
        xmlns="http://www.w3.org/1998/Math/MathML"
        alttext="{displaystyle Plor neg P}"
      >
        <semantics>
          <mrow class="MJX-TeXAtom-ORD">
            <mstyle displaystyle="true" scriptlevel="0">
              <mi>P</mi>
              <mo>&#x2228;<!-- u2228 --></mo>
              <mi mathvariant="normal">&#x00AC;<!-- u00ac --></mi>
              <mi>P</mi>
            </mstyle>
          </mrow></semantics
        ></math
      ></span
    ></span
  >
</li>
```

There is a lot more of that. If you are wondering what the semantics section is, it's the logical semantic character for a proposal or statement. Maybe that is called propositional calculus represented with p, q, etc. using logical connectives like \displaystyle \And ,\rightarrow ,\lor ,\equiv ,\sim. It looks like an italics _P V (not) P_ in a browser, but the formulas are un-selectable like images. On other sites, they come out as escape characters.

### End of the sprint

As a sprint retro, it's good to look back over what was accomplished.

As part of the [epic to add an order to the list](https://github.com/timofeysie/khipu/issues/42), first there was urgent need to refactor the item.store

This lead to a desire to see the fallacies list in action to make things more interesting. Thus the parse the wiki-list api results for items, issue #44 was begun about 30 days ago.

During this time the docs directory gained a new sub=-directory for architecture, and some of the content from the long readme was added to their own files, such as this one.

A long discussion on the firebase-realtime-db.md file led to more separation of concerns into load and save features accessed through a new FAB (fabulous action button) on the categories page which put our old add category feature to better use.

Now we can create the list of fallacies from wikidata and wikipedia, and create (overwrite) the list on Firebase. Yes, it's only loaded up for fallacies, but needs to be thought out more as to how to enter new categories and opposed to edit an existing category.

That, and the functionality from the item.store that was moved to add-category needs to be removed and that class now should only read the existing list from the db.

And then, there would be the little question of ordering and pagination. So, we've got a long way to go/ But the last thirty days have shown some good work with only a little time spent every evening plodding away at the issues raised on GitHub.

Oh, and milestones started getting put to use to try to tame the growing scope of this project. That's been another positive development.

One regression was that now [no icons at all show up on the app](https://github.com/timofeysie/khipu/issues/47). They went from working, except newly added ones, to fixed, then to none at all. Not sure how rocket handles the ionic icons, but it needs to be addressed. It wasn't high priority, but it's a blocker for a release, which needs to be done soon.

Commit message: closes #44 closes #45 closes #50 overwrite and save merged list of items working

## Previous notes on Cognitive biases parsing

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

## Investigating the Fallacies category

The wikipedia section url looks like this:

https://radiant-springs-38893.herokuapp.com/api/wiki-list/%20%20%20%20fallacies/1/en

Why is the category preceded by /%20%20%20%20? This will work just as well:

http://localhost:5000/api/wiki-list/fallacies/1/en

What about this:

https://radiant-springs-38893.herokuapp.com/api/wiki-list/fallacies/en

http://localhost:5000/api/wiki-list/%20%20%20%20fallacies/1/en

The api endpoint in Conchifolia is "/api/wiki-list/:name/:id/:lang"

So these would end up being:

```txt
req.params.name fallacies
req.params.id 1
req.params.lang en
```

The id should actually be called section. Made that change so it will be clear later.

What we want is to get the whole list, if nothing else but to determine the entire number of sections needed so we don't have to hard-wire the number of sections.

```js
let newUrl = wikiMediaUrl.replace("http", "https");
// TODO: move this into curator
if (section === "all") {
```

This is some hidden business logic, which is why I couldn't remember how to get the full list. Not ideal and should probably be a separate api endpoint.

We will also have a problem with out fetch list. I don't think the Rxjs operator we use right now will be flexible enough to allow a variable number of service calls within the loop.

Lets look at what the sections give us:

### section 0

category description: A fallacy is reasoning that is logically incorrect, undermines the logical validity of an argument, or is recognized as unsound. All forms of human communication can contain fallacies.\n

### section 1

Formal fallacies[edit]

Main article: Formal fallacy

A formal fallacy is an error in the argument's form.[1] All formal fallacies are types of non sequitur.

- Appeal to probability \u2013 a statement that takes something for granted because it would probably be the case (or might be the case).[2][3]
- Argument from fallacy (also known as the fallacy fallacy) \u2013 the assumption that, if an argument is fallacious, then the conclusion is false.[4]
- Base rate fallacy \u2013 making a probability judgment based on conditional probabilities, without taking into account the effect of prior probabilities.[5]
- Conjunction fallacy \u2013 the assumption that an outcome simultaneously satisfying multiple conditions is more probable than an outcome satisfying a single one of them.[6]
- Masked-man fallacy (illicit substitution of identicals) \u2013 the substitution of identical designators in a true statement can lead to a false one.[7]

Propositional fallacies

A propositional fallacy is an error that concerns compound propositions. For a compound proposition to be true, the truth values of its constituent parts must satisfy the relevant logical connectives that occur in it (most commonly: [and], [or], [not], [only if], [if and only if]). The following fallacies involve relations whose truth values are not guaranteed and therefore not guaranteed to yield true conclusions.\n

Types of propositional fallacies:

- Affirming a disjunct \u2013 concluding that one disjunct of a logical disjunction must be false because the other disjunct is true; A or B; A, therefore not B.[8]
- Affirming the consequent \u2013 the antecedent in an indicative conditional is claimed to be true because the consequent is true; if A, then B; B, therefore A.[8]
- Denying the antecedent \u2013 the consequent in an indicative conditional is claimed to be false because the antecedent is false; if A, then B; not A, therefore not B.[8]

Quantification fallacies

A quantification fallacy is an error in logic where the quantifiers of the premises are in contradiction to the quantifier of the conclusion.\n
Types of quantification fallacies:\n

- Existential fallacy \u2013 an argument that has a universal premise and a particular conclusion.[9]

Syllogistic fallacies \u2013 logical fallacies that occur in syllogisms.\n
(no separate description other that the part after the title)

- Affirmative conclusion from a negative premise (illicit negative) \u2013 a categorical syllogism has a positive conclusion, but at least one negative premise.[9]
- Fallacy of exclusive premises \u2013 a categorical syllogism that is invalid because both of its premises are negative.[9]
- Fallacy of four terms (quaternio terminorum) \u2013 a categorical syllogism that has four terms.[10]
- Illicit major \u2013 a categorical syllogism that is invalid because its major term is not distributed in the major premise but distributed in the conclusion. [9]
- Illicit minor \u2013 a categorical syllogism that is invalid because its minor term is not distributed in the minor premise but distributed in the conclusion. [9]
- Negative conclusion from affirmative premises (illicit affirmative) \u2013 a categorical syllogism has a negative conclusion but affirmative premises.[9]
- Fallacy of the undistributed middle \u2013 the middle term in a categorical syllogism is not distributed.[11]
- Modal fallacy \u2013 confusing necessity with sufficiency. A condition X is necessary for Y if X is required for even the possibility of Y. X doesn\u2019t bring about Y by itself, but if there is no X, there will be no Y. For example, oxygen is necessary for fire. But one cannot assume that everywhere there is oxygen, there is fire. A condition X is sufficient for Y if X, by itself, is enough to bring about Y. For example, riding the bus is a sufficient mode of transportation to get to
- Modal scope fallacy \u2013 a degree of unwarranted necessity is placed in the conclusion.

Count 18.

### section 2

Propositional fallacies

A propositional fallacy is an error that concerns compound propositions. For a compound proposition to be true, the truth values of its constituent parts must satisfy the relevant logical connectives that occur in it (most commonly: [and], [or], [not], [only if], [if and only if]). The following fallacies involve relations whose truth values are not guaranteed and therefore not guaranteed to yield true conclusions.\n

Types of propositional fallacies:\n

- Affirming a disjunct \u2013 concluding that one disjunct of a logical disjunction must be false because the other disjunct is true; A or B; A, therefore not B.[1]
- Affirming the consequent \u2013 the antecedent in an indicative conditional is claimed to be true because the consequent is true; if A, then B; B, therefore A.[1]
- Denying the antecedent \u2013 the consequent in an indicative conditional is claimed to be false because the antecedent is false; if A, then B; not A, therefore not B.[1]

Count: 3.

### section 3

Quantification fallacies

A quantification fallacy is an error in logic where the quantifiers of the premises are in contradiction to the quantifier of the conclusion.\n
Types of quantification fallacies:\n

- Existential fallacy \u2013 an argument that has a universal premise and a particular conclusion.[1]

### section 4

Formal syllogistic fallacies[edit]

Syllogistic fallacies \u2013 logical fallacies that occur in syllogisms.\n

- Affirmative conclusion from a negative premise (illicit negative) \u2013 a categorical syllogism has a positive conclusion, but at least one negative premise.[1]
- Fallacy of exclusive premises \u2013 a categorical syllogism that is invalid because both of its premises are negative.[1]
- Fallacy of four terms (quaternio terminorum) \u2013 a categorical syllogism that has four terms.[2]
- Illicit major \u2013 a categorical syllogism that is invalid because its major term is not distributed in the major premise but distributed in the conclusion. [1]
- Illicit minor \u2013 a categorical syllogism that is invalid because its minor term is not distributed in the minor premise but distributed in the conclusion. [1]
- Negative conclusion from affirmative premises (illicit affirmative) \u2013 a categorical syllogism has a negative conclusion but affirmative premises.[1]
- Fallacy of the undistributed middle \u2013 the middle term in a categorical syllogism is not distributed.[3]
- Modal scope fallacy \u2013 a degree of unwarranted necessity is placed in the conclusion.

count: 8.

### section 5

Contents

1 Informal fallacies\n
1.1 Improper premise
1.2 Faulty generalizations
1.3 Questionable cause
1.4 Relevance fallacies\n
1.4.1 Red herring fallacies

Informal fallacies

this is a massive section with sub-sections. Here is one example of fallacy with sub-fallacies of it's own.

- Equivocation \u2013 using a term with more than one meaning in a statement without specifying which meaning is intended.[7]

  - Ambiguous middle term \u2013 using a middle term with multiple meanings.[8]
  - Definitional retreat \u2013 changing the meaning of a word when an objection is raised.[9] Often paired with moving the goalposts (see below), as when an argument is challenged using a common definition of a term in the argument, and the arguer presents a different definition of the term and thereby demands different evidence to debunk the argument.
  - Motte-and-bailey fallacy \u2013 conflating two positions with similar properties, one modest and easy to defend (the \"motte\") and one more controversial (the \"bailey\").[10] The arguer first states the controversial position, but when challenged, states that they are advancing the modest position.[11][12]
  - Fallacy of accent \u2013 changing the meaning of a statement by not specifying on which word emphasis falls.
  - Persuasive definition \u2013 purporting to use the \"true\" or \"commonly accepted\" meaning of a term while, in reality, using an uncommon or altered definition.
  - (cf. the if-by-whiskey fallacy)

Definitional retreat has no link, which means there is no single page for it, and this the definition here is all we will have.

The "if-by-whiskey fallacy" is irregular. Luckily this already exists in the wikidata list/.

### section 6

Improper premise

- Begging the question (petitio principii) \u2013 using the conclusion of the argument in support of itself in a premise (e.g.: saying that smoking cigarettes is deadly because cigarettes can kill you; something that kills is deadly).[1][2][3]

  - Loaded label \u2013 while not inherently fallacious, the use of evocative terms to support a conclusion is a type of begging the question fallacy. When fallaciously used, the term's connotations are relied on to sway the argument towards a particular conclusion. For example, an organic foods advertisement that says \"Organic foods are safe and healthy foods grown without any pesticides, herbicides, or other unhealthy additives.\" Use of the term \"unhealthy additives\" is used as support for the idea that the product is safe.[4]

- Circular reasoning (circulus in demonstrando) \u2013 the reasoner begins with what he or she is trying to end up with (e.g.: all bachelors are unmarried males).
- Fallacy of many questions (complex question, fallacy of presuppositions, loaded question, plurium interrogationum) \u2013 someone asks a question that presupposes something that has not been proven or accepted by all the people involved. This fallacy is often used rhetorically so that the question limits direct replies to those that serve the questioner's agenda.

### section 7

Faulty generalizations[edit]
...

count 9 with some sub-items.

### section 8

Questionable cause[edit]

### section 9

Relevance fallacies[edit]
Red herring fallacies[edit] (lots of there)

- Ad hominem \u2013 attacking the arguer instead of the argument. (Note that \"ad hominem\" can also refer to the dialectical strategy of arguing on the basis of the opponent's own commitments. This type of ad hominem is not a fallacy.)\n
  - Circumstantial ad hominem \u2013 stating that the arguer's personal situation or perceived benefit from advancing a conclusion means that their conclusion is wrong.[11]
    ...

### section 10

Red herring fallacies

- Ad hominem \u2013 attacking the arguer instead of the argument. (Note that \"ad hominem\" can also refer to the dialectical strategy of arguing on the basis of the opponent's own commitments. This type of ad hominem is not a fallacy.)\n

  - Circumstantial ad hominem \u2013 stating that the arguer's personal situation or perceived benefit from advancing a conclusion means that their conclusion is wrong.[4]
    ...

How is there a whole more section of red herring fallacies when they are also listed as a sub-section of the relevance fallacies?
As you can see, they are the same as the section 9 fallacies.
