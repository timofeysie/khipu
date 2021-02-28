import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '@app/core/interfaces/categories';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
declare function require(name: string): any;

@Injectable()
export class ItemsListEndpoint {
  constructor(private httpClient: HttpClient) {}

  /**
   * Create a SPARQL query for paginated views.
   * @param category
   * @param currentPage
   */
  listItems(category: Category, currentPage: number): Observable<any> {
    const url = this.generateUrl(category, currentPage);
    return this.httpClient.get<any[]>(url).pipe(
      map(response => {
        return response['results']['bindings'];
      })
    );
  }

  /**
   * Get the whole list SPARQL.
   * @param category
   */
  listAllItems(category: Category): Observable<any> {
    const url = this.generateUrlForFullList(category);

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

  generateUrlForFullList(category: Category): string {
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
            ORDER BY (LCASE(?label))`;
    return wbk.sparqlQuery(sparql);
  }
}
