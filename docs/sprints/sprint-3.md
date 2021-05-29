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

## Fixing the unit tests

A decision was made to let the unit tests go since this is just a path-finding demo app. But now, unit tests have become important again. It's time to bring them up to speed.

Currently:

```txt
Test Suites: 11 failed, 18 passed, 29 total
Tests:       8 failed, 65 passed, 73 total
```

Starting from the bottom, we will have a lot of null injector errors like this:

```txt
 FAIL  src/app/features/options/services/sw/log-update.service.spec.ts
  ● LogUpdateService › should be created
    NullInjectorError: StaticInjectorError(DynamicTestModule)[SwUpdate]:
      StaticInjectorError(Platform: core)[SwUpdate]:
        NullInjectorError: No provider for SwUpdate!
```

I don't know actually if we are using the service worker.

Anyhow, if we do, it needs to be in the app module. Or in this case the test module.

Updating to latest version of Angular could fix this issue. This error is in fix tests.

But we did include the update module to bust the caching issues.

Creating a mock class to deal with this seems like a good idea, but there is another problem with that:

```js
import {
  UpdateActivatedEvent,
  UpdateAvailableEvent
} from '@angular/service-worker/src/low_level';
```

The error:

```txt
Cannot find module '@angular/service-worker/src/low_level' or its corresponding type declarations.ts(2307)
```

Fixing this could be a rabbit hole. Apparently it will go away with the update. But the goal today is getting the unit tests working, not going down an upgrade rabbit hole.

Adding the real thing to the test fixes the error:

```js
beforeEach(() =>
  TestBed.configureTestingModule({
    providers: [SwUpdate]
  })
);
```

Next at the bottom of the list:

```txt
 FAIL  src/app/core/authentication/authentication.service.spec.ts
  ● Test suite failed to run
    TypeScript diagnostics (customize using `[jest-config].globals.ts-jest.diagnostics` option):
    src/app/core/authentication/authentication.service.spec.ts:32:25 - error TS7006: Parameter 'credentials' implicitly has an 'any' type.
```

Adding the type to the assert seems to fix the issue:

```js
      // Assert
      request.subscribe((credentials: Credentials) => {
```

Next:

```txt
  ● AuthenticationService › logout › should clear user authentication
    TypeError: Cannot read property 'login' of undefined
...
at src/app/core/authentication/authentication.service.spec.ts:91:50
```

The earlier tests don't seem to be failing. Why is the test bed class undefined here?

```js
authenticationService = TestBed.get(AuthenticationService);
```

Created a new one there to move on.

```txt
 FAIL  src/app/features/category-item-details/category-item-details.service.spec.ts
  ● Test suite failed to run
    TypeScript diagnostics (customize using `[jest-config].globals.ts-jest.diagnostics` option):
    src/app/features/category-item-details/category-item-details.service.spec.ts:6:30 - error TS2307: Cannot find module './quote.service'.
    6 import { QuoteService } from './quote.service';
```

That test was still relying on the quote service, not the category item details service. Change that, but keep the original demo tests going and move on.

The new status is:

```txt
Test Suites: 10 failed, 19 passed, 29 total (was 11 failed, 18 passed, 29 total)
Tests:       13 failed, 67 passed, 80 total (was 8 failed, 65 passed, 73 total)
```

Can't really write home about that. Keep moving.

```txt
    src/app/features/category-item-details/item-details/container/item-details/item-details-container.component.spec.ts:2:46 - error TS2307: Cannot find module './categories-container.component'.
    2 import { CategoriesContainerComponent } from './categories-container.component';
```

That import has moved, from here:

```js
import { CategoriesContainerComponent } from './categories-container.component';
```

To here:

```js
import { CategoriesContainerComponent } from './categories/container/categories-list/categories-container.component';
```

Right. We did move a lot of files around. There will be a lot of these.

But actually, it the test is for this: ItemDetailsContainerComponent.

```txt
  ● CategoriesComponent › should create
    expect(received).toBeTruthy()
    Received: undefined
      22 |   it('should create', () => {
    > 23 |     expect(component).toBeTruthy();
      24 |   });
      25 | });
      at src/app/features/category-item-details/item-details/container/item-details/item-details-container.component.spec.ts:23:23
```

This file was converted from or even a copy of the CategoriesComponent the just had the spec file name changed and the unit test never updated until now. So it should evolve to test what it actually should, which is the ItemDetailsContainerComponent.

Next up:

```txt
 FAIL  src/app/features/options/services/sw/log-update.service.spec.ts
  ● LogUpdateService › should be created
    NullInjectorError: StaticInjectorError(DynamicTestModule)[SwUpdate -> NgswCommChannel]:
      StaticInjectorError(Platform: core)[SwUpdate -> NgswCommChannel]:
        NullInjectorError: No provider for NgswCommChannel!
```

The service worker again. [This is an issue for others also](https://github.com/angular/angular/issues/22619): _. If you are trying to inject SwUpdate, you also need to provide the dependencies that it needs._

Not quite sure how to mock what we need from the service worker, so using the real LogUpdateService for now.

Along these same lines, this is the next failure:

```txt
 FAIL  src/app/features/options/services/sw/prompt-update.service.spec.ts
  ● PromptUpdateService › should be created
    NullInjectorError: StaticInjectorError(DynamicTestModule)[SwUpdate]:
      StaticInjectorError(Platform: core)[SwUpdate]:
        NullInjectorError: No provider for SwUpdate!
```

Doing the same thing for prompt-update.service.spec changes the error slightly:

````txt
 FAIL  src/app/features/options/services/sw/prompt-update.service.spec.ts
  ● PromptUpdateService › should be created
    NullInjectorError: StaticInjectorError(DynamicTestModule)[SwUpdate -> NgswCommChannel]:
      StaticInjectorError(Platform: core)[SwUpdate -> NgswCommChannel]:
        NullInjectorError: No provider for NgswCommChannel!
``

The solution for these was pointed out in this [StackOverflow](https://stackoverflow.com/questions/54779752/nullinjectorerror-no-provider-for-swupdate-swupdate-does-not-work-angular-5):

```js
TestBed.configureTestingModule({
  declarations: [ MyComponent ],
  imports: [
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: false })
  ]
})
````

Next up:

```txt
  ● DescriptionFormComponent › should create
    expect(received).toBeTruthy()
    Received: undefined
      21 |   it('should create', () => {
    > 22 |     expect(component).toBeTruthy();
      23 |   });
      24 | });
      at src/app/features/category-item-details/item-details/components/description-form/description-form.component.spec.ts:22:23
```

Just looking at the last failed test sometimes is not enough. Just seeing the above and checking that indeed the test is correctly trying to instantiate the correct component means the problem lies elsewhere. In this case looking at the failure previous to this gives a hint:

```txt
  ● DescriptionFormComponent › should create
    Template parse errors:
    Can't bind to 'formControl' since it isn't a known property of 'ion-textarea'.
```

This is an easy one. When using Angular forms, you have to import ReactiveFormsModule.

```txt
  ● DescriptionFormComponent › should create
    Can't bind to 'placeholder' since it isn't a known property of 'ion-textarea'.
```

This one I have no idea. Maybe import the FormsModule (again)? C'mon, this isn't Saturday Night Live. Maybe try import { IonicModule } from '@ionic/angular'?

O-Kay... moving on for now:

```txt
 FAIL  src/app/features/options/services/sw/check-for-update.service.spec.ts
  ● CheckForUpdateService › should be created
    NullInjectorError: StaticInjectorError(DynamicTestModule)[SwUpdate]:
      StaticInjectorError(Platform: core)[SwUpdate]:
        NullInjectorError: No provider for SwUpdate!
```

Yep. Knew that was coming. Same as the other service worker failures. No on with the show (it's not a show really, he just likes saying things like that):

```txt
  ● AuthenticationService › logout › should clear user authentication
      StaticInjectorError(Platform: core)[AuthenticationService -> RealtimeDbService]:
    NullInjectorError: StaticInjectorError(DynamicTestModule)[AuthenticationService -> RealtimeDbService]:
        NullInjectorError: No provider for RealtimeDbService!
```

I've got a question, do they really need to put an exclamation mark there? I mean, it's they they are getting frustrated with us (or something).

```txt
  ● AuthenticationService › logout › should clear user authentication
    Uncaught (in promise): TypeError: Cannot read property 'uid' of null
    TypeError: Cannot read property 'uid' of null
      260 |         return this.userId;
      261 |       } else {
    > 262 |         const id = firebase.auth().currentUser.uid;
      263 |         if (id) {
      264 |           this.userId = id;
      265 |           return id;
      at src/app/core/firebase/realtime-db.service.ts:262:47
```

How does an error in the rtdb show up there? Sounds bad though. Does this make sense?

```js
const id = firebase.auth().currentUser?.uid;
```

No no no! Expression expected! OK, just a regular if then. Now time to show some progress:

```txt
Test Suites: 7 failed, 22 passed, 29 total (was 11)
Tests:       11 failed, 70 passed, 81 total (was 8)
```

I'm not sure I'm seeing much progress there where there seem to be actually more failing tests now. I'm hungry. Next!

```txt
 FAIL  src/app/features/options/options.component.spec.ts
  ● OptionsComponent › should create
    NullInjectorError: StaticInjectorError(DynamicTestModule)[TranslateService]:
      StaticInjectorError(Platform: core)[TranslateService]:
        NullInjectorError: No provider for TranslateService!
```

That was easy. Next up:

```txt
 FAIL  src/app/features/theme/theme.component.spec.ts
  ● ThemeComponent › should create
    TypeError: Cannot read property 'primary' of null
```
