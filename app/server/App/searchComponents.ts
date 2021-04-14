import * as path from 'path';

import * as _ from 'lodash';

import sql from "../sql";
import * as FS from '../FS';
import {rootFn} from "../utils";
import {ApiComponent} from "../../src/Logic/io/ComponentFetcher";

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

    const stdTokens = (await Promise.all((await FS.readdir(path.join(await rootFn(), 'lib', 'components')))
        .filter(i => i.endsWith('.json'))
        .map(async i => [i, JSON.parse(await FS.readFile(path.join(await rootFn(), 'lib', 'components', i))) as ApiComponent] as [string, ApiComponent])))
        .map(i => ({componentToken: `$${i[0].split('.').slice(0, -1).join('.')}`, componentName: i[1].name}))
        .filter(i => i.componentName.includes(query));

    return {
        foundComponents: _.mapValues(_.keyBy(tok.concat(stdTokens), 'componentToken'), i => i.componentName),
        page: Math.max(page, 0),
        resultsPerPage: recordsPerPage,
    }
}