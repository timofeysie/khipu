import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Item } from './items.store.state';
import { Category } from '@app/core/interfaces/categories';
import { map, tap } from 'rxjs/operators';
import { environment } from '@env/environment';
declare function require(name: string): any;

@Injectable()
export class ItemsListEndpoint {
  constructor(private httpClient: HttpClient) {}

  listItems(category: Category, currentPage: number): Observable<any> {
    const url = this.generateUrl(category, currentPage);

    return this.httpClient.get<any[]>(url).pipe(
      map(response => {
        return response['results']['bindings'];
      })
    );
  }

  generateUrl(category: Category, currentPage: number): string {
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
            ORDER BY (LCASE(?label))
            LIMIT ${environment.paginationItemsPerPage}
            OFFSET ${currentPage * environment.paginationItemsPerPage}`;
    return wbk.sparqlQuery(sparql);
  }
}
