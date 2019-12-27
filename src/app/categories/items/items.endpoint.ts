import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Item } from './items.store.state';
import { Category } from '@app/core/interfaces/categories';
import { map, tap } from 'rxjs/operators';
declare function require(name: string): any;

@Injectable()
export class ItemsListEndpoint {
  constructor(private httpClient: HttpClient) {}

  listItems(category: Category): Observable<any> {
    const url = this.generateUrl(category);

    return this.httpClient.get<any[]>(url).pipe(
      map(response => {
        return response['results']['bindings'];
      })
    );
  }

  generateUrl(category: Category): string {
    const wbk = require('wikibase-sdk')({
      instance: 'https://query.wikidata.org/sparql',
      sparqlEndpoint: 'https://query.wikidata.org/sparql'
    });

    const sparql = `
            SELECT ?${category.name} ?${category.name}Label ?${category.name}Description WHERE {
                SERVICE wikibase:label {
                    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],${category.language}".
                }
                ?${category.name} wdt:${category.wdt} wd:${category.wd}.
            }
            LIMIT 1000`;
    return wbk.sparqlQuery(sparql);
  }
}
