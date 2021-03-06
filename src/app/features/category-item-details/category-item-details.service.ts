import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ItemDetails } from '@app/core/interfaces/item-details';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

const routes = {
  wikidata: (c: WikidataContext) => `www.wikidata.org/wiki/Special:EntityData/${c.qcode}.json`,
  wikipedia: (c: WikipediaContext) =>
    `https://radiant-springs-38893.herokuapp.com/api/detail/${c.title}/${c.language}/false`,
  wikimedia: (c: WikipediaContext) =>
    `https://radiant-springs-38893.herokuapp.com/api/details/${c.language}/${c.title}`,
  wikilist: (c: WikilistContext) =>
    `https://radiant-springs-38893.herokuapp.com/api/wiki-list/${c.title}/${c.section}/${c.language}`
};

export interface WikidataContext {
  qcode: string;
}

export interface WikipediaContext {
  language: string;
  title: string;
}

export interface WikilistContext {
  title: string;
  section: string;
  language: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryItemDetailsService {
  constructor(private httpClient: HttpClient) {}

  getItemDetails(context: WikidataContext): Observable<string> {
    return this.httpClient
      .cache()
      .get(encodeURI(routes.wikidata(context)))
      .pipe(
        map((body: any) => body),
        catchError(() => of('Error, could not load details.'))
      );
  }

  getWikipediaItemDescription(context: WikipediaContext): Observable<string> {
    return this.httpClient
      .cache()
      .get(encodeURI(routes.wikipedia(context)))
      .pipe(
        map((body: any) => body),
        catchError(() => of('Error, could not load details.'))
      );
  }

  getWikimediaDescription(context: WikipediaContext): Observable<string> {
    return this.httpClient
      .cache()
      .get(encodeURI(routes.wikimedia(context)))
      .pipe(
        map((body: any) => body),
        catchError(() => of('Error, could not load details.'))
      );
  }

  getWikilist(context: WikilistContext): Observable<string> {
    return this.httpClient
      .cache()
      .get(encodeURI(routes.wikilist(context)))
      .pipe(
        map((body: any) => body),
        catchError(() => of('Error, could not load wikilist.'))
      );
  }
}
