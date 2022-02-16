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

After a commit and a bit of time later, this interesting cookie is on the bottom of the list:

```txt
 ● AuthenticationService › logout › should clear user authentication
    The email address is badly formatted.
      42 |       })
      43 |       .catch((error: any) => {
    > 44 |         throw new Error(error.message);
      45 |       }
      at src/app/core/authentication/authentication.service.ts:44:15
```

Another thing that might help with errors like this is following suggestion #2:

```txt
 ● ItemDetailsContainerComponent › should create

    Template parse errors:
    'ion-menu-button' is not a known element:
    1. If 'ion-menu-button' is an Angular component, then verify that it is part of this module.
    2. If 'ion-menu-button' is a Web Component then add 'CUSTOM_ELEMENTS_SCHEMA' to the '@NgModule.schemas' of this component to
suppress this message.
```

I mean, we know that the app works, so it's just about the tests allowed to work.

Actually, we have that imported into the app component. Maybe it needs to be added to all the specs? It was done two years ago, but I think the tests were passing about one year ago, so not sure if that's the fix.

Adding IonicModule to the item-details-container.component.spec.ts didn't help.

Trying to get the ItemDetailsContainerComponent test sorted, and all of a sudden, this failure:

```txt
Determining test suites to run...
  ● Test suite failed to run
    Configuration error:
    Could not locate module @app/core/interfaces/categories.js mapped as:
    C:\Users\timof\repos\timofeysie\khipu\src\app\core/interfaces/categories.js.
    Please check your configuration for these entries:
    {
      "moduleNameMapper": {
        "/@app\/(.*)/": "C:\Users\timof\repos\timofeysie\khipu\src\app\$1"
      },
      "resolver": null
    }
      at createNoMappedModuleFoundError (node_modules/jest-resolve/build/index.js:501:17)
          at Array.reduce (<anonymous>)
```

It's all in scary red. I do see some of the other tests running, but the status at the end of the run is never shown. This was not an issue yesterday...

It's strange, as there is a reversed slash in the path there:

C:\Users\timof\repos\timofeysie\khipu\src\app\core/interfaces/categories.js.

Trying to run the app results in this error:

```txt
10   activateUpdate = jasmine.createSpy('MockSwUpdate.activateUpdate').and.callFake(() => Promise.resolve());
ERROR in src/app/features/options/services/sw/mock-sw-updated.ts:10:20 - error TS2304: Cannot find name 'jasmine'.
                      ~~~~~~~
src/app/features/options/services/sw/mock-sw-updated.ts:12:20 - error TS2304: Cannot find name 'jasmine'.
12   checkForUpdate = jasmine.createSpy('MockSwUpdate.checkForUpdate').and.callFake(() => Promise.resolve());
                      ~~~~~~~
```

We haven't even used that mock yet, so get rid of that. It's just an example that can be used if we are serious about testing the service worker capabilities, which we aren't at this point. So comment that out and the app builds. Now try the tests again.

No dice clay. It's strange because almost nothing has changed since the tests were all running.

I guess it was just a typo. Not sure why it didn't stop the test run previously.

This was in the src\app\features\category-item-details\categories\categories.endpoint.ts file:

```js
import { Category } from '@app/core/interfaces/categories.js';
```

So now it's back to failures from the bottom of the list:

```txt
 FAIL  src/app/features/theme/theme.component.spec.ts
  ● Console
    console.log src/app/core/logger.service.ts:107
      [ThemeService] null
    console.log src/app/core/logger.service.ts:107
      [ThemeService] save theme null
    console.warn node_modules/@ionic/angular/dist/fesm5.cjs.js:5260
      [DEPRECATION][Events]: The Events provider is deprecated and it will be removed in the next major release.
        - Use "Observables" for a similar pub/sub architecture: https://angular.io/guide/observables
        - Use "Redux" for advanced state management: https://ngrx.io
  ● ThemeComponent › should create
    TypeError: Cannot read property 'primary' of null
```

There has been a problem with the default theme being loaded for some time. But since that's just a nice to have feature, no one worried about it. Fixing that with a hack, there are still some issues with the tests:

```txt
  ● ThemeComponent › should create
    Illegal state: Could not load the summary for directive ThemeComponent.
      at syntaxError (../packages/compiler/src/util.ts:100:17)
```

After adding all the components from the theme.component to the spec, it's still failing with the same message shown above.

Adding some components to the providers array seemed to fix the issues with the theme component. It's still confusing what should go in declarations vs imports vs providers in unit tests.

During the search to fix this test, this came up:

_Are Karma, Jasmine are dead? They are only good for testing whether or not a component creates. Everything else is much better tested using Cypress.io. Checking in code is delayed all because of nonsense like these errors. Even when I fix the immediate error, there are other layers of errors to come. Each one with ridiculous vague messages._

_Using the native Angular Karma/Jasmine test schematics are painful and cost major amounts of time. It requires us to discover imports for every dependency in your component; even those that are 3,4,5 layers deep. Outbound/inbound HTML calls will not work due to how Karma works. To acheive some level of depth in the test we need to create lots of mockobjects, spies and spend too much time debugging why things don't work._

That's nice. Too bad it's my job to worry about old unit tests. Next:

```txt
  ● OptionsComponent › should create
    Unexpected value 'I18nService' declared by the module 'DynamicTestModule'. Please add a @Pipe/@Directive/@Component annotation.
```

Next, there are a lot of these:

```txt
 FAIL  src/app/core/authentication/authentication.service.spec.ts
  ● AuthenticationService › login › should return credentials
    The email address is badly formatted.
      43 |       .catch((error: any) => {
    > 44 |         throw new Error(error.message);
         |               ^
      45 |       });
      at src/app/core/authentication/authentication.service.ts:44:15
```

I guess username: toto should be username: toto@toto.com?

Then, we get these errors:

```txt
  ● AuthenticationService › logout › should clear user authentication
    Cannot make XHRs from within a fake async test. Request URL: https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyBDeqGbiib0fVFoc2yWr9WVE4MV6isWQ9Y
```
