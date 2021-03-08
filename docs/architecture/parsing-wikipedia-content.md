# Parsing Wikipedia Content

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

So next it's determine how to cut off the parsing, and then fix up the issues of the items that are captured.

Commit message: #44 #35 parsing label and description from wikipedia page wip

Issue #35 is: Remove label text from default user descriptions and add tooltip with explanation

Since we will be removing labels from descriptions here for the wikipedia parsing, it's related to that issue.

The only thing that sticks out right now to determine the end of the list is this:

```html
<span
  ><img alt=""
  src="//upload.wikimedia.org/wikipedia/commons/thumb/2/20/Text-x-generic.svg/28px-Text-x-generic.svg.png"
  decoding="async"</span
>
```

That's as good as any at this point. We are going to have to provide the user with easy list editing tools, and one of these could be an end of list delimiter which would discard anything after a particular item. So on with the show!

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
