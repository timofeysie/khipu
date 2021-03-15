/**
 * This is shared by wikidata and wikipedia items.
 * The wikipedia items have sup tags.
 * The category is the name of the whole subject.
 * The type is the way the wikipedia page has h2 and h3 titles.
 * The name of these sections is kept in the type.
 *
 *
 */
export interface Item {
  label: string;
  description: string;
  type?: string; // is usually set to "literal"
  uri?: string; // link for the wikipedia detail page
  wikidataUri?: string; // link for the wikidata page
  categoryType?: string; // may not need this
  sectionTitle?: string; // wikipedia section titles
  sectionTitleTag?: string; // h2/h3, etc?
  binding?: any; // I don't think we need this
  metaData?: any; // user description and other meta data
  sup?: string[]; // supplemental references
  source?: 'Wikidata' | 'Wikilist';
}
