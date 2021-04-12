import * as _ from 'lodash';
import sql from "../sql";

export type tokenMap = { [token: string]: string };

interface paginatedSearchQuery {
    foundComponents: tokenMap,
    page: number,
    // pages: number,
    resultsPerPage: number,
    // resultNum: number
}

export default async function searchComponents(query: string, page: number = 0): Promise<paginatedSearchQuery> {
    const recordsPerPage: number = 25;

    const tok = await sql.sql_all<{ componentToken: string, componentName: string }>(`SELECT componentToken, componentName
                                                                                       from components
                                                                                       where componentName like ?1
                                                                                       LIMIT ?2 * ?3, ?3`, [`%${query}%`, Math.max(page, 0), recordsPerPage]);

    return {
        foundComponents: _.mapValues(_.keyBy(tok.map(i => Object.values(i)), '0'), i => i[1] as string),
        page: Math.max(page, 0),
        resultsPerPage: recordsPerPage,
    }
}