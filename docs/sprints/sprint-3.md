# Sprint 3 planing

Start: May 1st, 2021.

Goals:

Finishing off everything not working from the last sprint.

## Work log

1. First time going to a detail page, the user description is not filled
2. Redirect to data uri value response error (Issue #57)
3. Refactor the item-details-store and friends
4. Use an observer instead of a complete callback for the router params

### #1 First time going to a detail page, the user description is not filled

This was an issue before. Not sure when it stopped working or if it was ever fixed.

It's been brought forward from sprint 2 where it was #20.

Was there a ticket for this?

Ad Iram will never show it's user description in the details field.

Firebase is not being consulted for Wikidata items.

Adding more time to the timeout in the description.form.component works to let the description show up after it arrives. Tried changing the change detection strategy to on push but that didn't help get rid of the timeout hack.

The order of execution then for "ad iram" for which there is no Wikipedia page is:

1. 1. Wikidata qcode
      item-details.store.ts:58 a {entities: {…}}
      item-details.store.ts:65 itemDetails Ad iram
      item-details.store.ts:88 b
      item-details.store.ts:125 c {batchcomplete: "", query: {…}}
      item-details.store.ts:144 d
      logger.service.ts:107 [ErrorHandlerInterceptor] Request error HttpErrorResponse {headers: HttpHeaders, status: 300, statusText: "Multiple Choices", url: "https://radiant-springs-38893.herokuapp.com/api/detail/Ad%20iram/en/false", ok: false, …}
      Show 319 more frames
      item-details.store.ts:108 e Error, could not load details.
      logger.service.ts:107 [RealtimeDbService] 14. routeToData items/X0YFaM8hXHdm89FWEQsj0Aqhcln1/fallacies/Ad iram
      item-details.store.ts:170 existing item {item-details-viewed-count: 0, item-details-viewed-date: 1615885028509, uri: "", user-description: "accusing one's opponent of being angry or holding …isproves their argument or diminishes its weight.", user-description-viewed-count: 0, …}

The HttpErrorResponse for one of the items calls needs to be shown to the user.

```txt
url: "https://radiant-springs-38893.herokuapp.com/api/detail/Ad%20iram/en/false"
error: "Redirect to data uri value"
ok: false
status: 300
statusText: "Multiple Choices"
```

There is nothing descriptive enough there, so [raise an issue](https://github.com/timofeysie/conchifolia/issues/13) with that project to get that changed.
