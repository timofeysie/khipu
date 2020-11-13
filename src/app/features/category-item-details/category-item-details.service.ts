import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

const routes = {
  entities: (c: WikidataContext) => `/Special:EntityData/Q295150${c.qcode}.json`
};

export interface WikidataContext {
  qcode: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryItemDetailsService {
  constructor(private httpClient: HttpClient) {}

  getRandomQuote(context: WikidataContext): Observable<string> {
    return this.httpClient
      .cache()
      .get(routes.entities(context))
      .pipe(
        map((body: any) => body.value),
        catchError(() => of('Error, could not load joke :-('))
      );
  }
}
