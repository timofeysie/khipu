import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ItemDetails } from '@app/core/interfaces/item-details';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

const routes = {
  wikidata: (c: WikidataContext) => `/Special:EntityData/${c.qcode}.json`
};

export interface WikidataContext {
  qcode: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryItemDetailsService {
  constructor(private httpClient: HttpClient) {}

  getItemDetails(context: WikidataContext): Observable<string> {
    return this.httpClient
      .cache()
      .get(routes.wikidata(context))
      .pipe(
        map((body: any) => body),
        catchError(() => of('Error, could not load details.'))
      );
  }
}
