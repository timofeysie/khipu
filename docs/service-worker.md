# Service worker

There are three services shown in the official Angular docs to interact with the service worker.

```
check-for-update.service.ts
log-update.service.ts
prompt-update.service.ts
```

At first they were put in the core module, but maybe this is not the best place for them?  They will only be used on the options page, so maybe a services in the options page would be better.

Since we don't have an options module yet, they can stay in the about module for now.  The options and theming service should be a separate task, and the functionality can be moved there later.  The about page is actually a good idea and should be used for providing information about the app eventually.

Since the NgxRocket boilerplate start this project is based on also touts service worker integration with PWA support, I wonder about that versus what the official Angular docs say about it.  Nowhere in the app boilerplate do we see:
```
ServiceWorkerModule.register
```

Anyhow, the issue #1 is all about this.


## setup

Ran:
```
QuinquenniumF:khipu tim$ ng add @angular/pwa
Installing packages for tooling via npm.
+ @angular/pwa@0.803.21
added 9 packages from 44 contributors and audited 896737 packages in 142.811s
found 5 vulnerabilities (2 low, 3 moderate)
  run `npm audit fix` to fix them, or `npm audit` for details
Installed packages for tooling via npm.
Could not read file (/src/@app/app.module.ts).
```


## Publish on Firebase

The following are notes from the Tiwanaku project.

create the project in Firebase.
https://console.firebase.google.com/?pli=1

Complete the setup:
```
npm install -g firebase-tools
firebase login
firebase init
ionic build --prod
```


### Making changes to the PWA

1. If using an incognito window, open a second blank tab (This will keep the incognito and the cache state alive).
2. Close the application tab, but not the window. This should also close the Developer Tools.
3. Shut down http-server.
4. Build and run the server again.


### The Check for Update Service

Following [the official demo code](https://github.com/angular/angular/blob/master/aio/content/examples/service-worker-getting-started), created these providers.

```
ng g s services/check-for-update
ng g s services/log-update
ng g s services/prompt-update
```

### The check for update button
```
<button id="check" (click)="updateCheck()">Check for Update</button>
<p id="checkResult">{{updateCheckText}}</p>
```


### The links for the theme project
Project Console: https://console.firebase.google.com/project/emperor-don-carlos/overview
Hosting URL: https://emperor-don-carlos.firebaseapp.com


[This deployment guide](https://itnext.io/build-a-production-ready-pwa-with-angular-and-firebase-8f2a69824fcc) describes a production ready PWA process in decent depth.


### Caching strategies
* performance (resources that don’t change often)
* freshness (resources that change frequently)


### Asset groups
* lazy strategy
* prefetch strategy

10. Configuring a Firebase hosting for your PWA
* configure rewrite as above to point all sources to your index.html file
* the vendorChunk option in angular.json will because you will not update vendor libraries too often.


10.3 Adding HTTP/2 server push with link headers
12. Auditing your PWA with Lighthouse
12.3 Using Lighthouse CLI

iOS 11.3 has PWA support
