import path from 'path';

import _ from 'lodash';

import sql from '../../util/sql';
import * as FS from '../../util/files';
import {rootFn} from '../../util/utils';
import {ApiComponent} from '../../../app/document-editor/Logic/io/ComponentFetcher';

export type tokenMap = { [token: string]: string };

export interface paginatedSearchQuery {
    foundComponents: tokenMap,
    page: number,
    resultsPerPage: number,
}

export default async function searchComponents(query: string, page: number = 0): Promise<paginatedSearchQuery> {
    const recordsPerPage: number = 25;

    const tok = await sql.sql_all<{ componentToken: string, componentName: string }>(`SELECT "componentToken", "componentName"
                                                                                      from components
                                                                                      where "componentName" like $1
                                                                                      LIMIT $2 OFFSET  $3`, [`%${query}%`, recordsPerPage, recordsPerPage * page]);

    const stdTokens = (await Promise.all((await FS.readdir(path.join(await rootFn(), 'lib', 'components')))
        .filter(i => i.endsWith('.json'))
        .map(async i => [i, JSON.parse(await FS.readFile(path.join(await rootFn(), 'lib', 'components', i))) as ApiComponent] as [string, ApiComponent])))
        .map(i => ({componentToken: `$${i[0].split('.').slice(0, -1).join('.')}`, componentName: i[1].name}))
        .filter(i => i.componentName.toLowerCase().includes(query.toLowerCase()));

    return {
        foundComponents: _.mapValues(_.keyBy(tok.concat(stdTokens), 'componentToken'), i => i.componentName),
        page: Math.max(page, 0),
        resultsPerPage: recordsPerPage,
    }
}
