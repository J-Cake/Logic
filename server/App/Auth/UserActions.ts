import type express from 'express';
import _ from 'lodash'

import sql, {SQLInjectType} from '../../util/sql';
import {DBPreferenceMap} from '../Document/getFile';
import {defaultPreferences, PreferenceDescriptor, PreferenceType} from '../../../app/src/Enums';

export async function verifyUser(userToken?: string): Promise<boolean> {
    const exists = await sql.sql_get<{ exists: boolean }>(`select exists(select from users where "userToken" = $1) as "exists"`, [userToken || ""]);
    return exists.exists;
}

export function isLoggedIn(req: express.Request): boolean {
    return Boolean(req.header("auth-token") ?? (req.cookies ? req.cookies['auth-token'] : null) ?? req.userToken);
}

export async function getPreferencesForUser(userToken: string): Promise<DBPreferenceMap> {
    const pref: DBPreferenceMap = await sql.sql_get<DBPreferenceMap>(`SELECT *
                                                                      from user_preferences
                                                                      where "userId" = (SELECT "userId" from users where "userToken" = $1)`, [userToken]);

    const converters: Record<'bigint' | 'boolean' | 'number' | 'string' | 'object' | 'function' | 'symbol' | 'undefined', (t: any) => any> = {
        bigint: t => BigInt(t),
        boolean: t => Boolean(t),
        number: t => Number(t),
        string: t => String(t),
        object: t => Object(t),
        function: t => Function(t),
        symbol: t => Symbol(t),
        undefined: t => void t
    }

    for (const [a, i] of Object.entries(defaultPreferences as DBPreferenceMap))
        if (typeof i !== typeof (pref[a as keyof DBPreferenceMap]))
            // @ts-ignore // This can happen, even if typescript doesn't like it. For instance in SQLite, booleans are stored as 0s.
            pref[a as keyof DBPreferenceMap] =
                converters[typeof i](pref[a as keyof DBPreferenceMap]) as DBPreferenceMap[keyof DBPreferenceMap];

    return _.pick(pref, Object.keys(defaultPreferences)) as DBPreferenceMap;
}

export function convertFromHTMLForm(pref: Record<keyof DBPreferenceMap, string>): DBPreferenceMap {
    const converters: Record<'bigint' | 'boolean' | 'number' | 'string' | 'object' | 'function' | 'symbol' | 'undefined', (t: any) => any> = {
        bigint: t => BigInt(t),
        boolean: t => t === 'on',
        number: t => Number(t),
        string: t => String(t),
        object: t => Object(t),
        function: t => Function(t),
        symbol: t => Symbol(t),
        undefined: t => void t
    }

    return _.mapValues(pref, function (i, a) {
        const descriptor = PreferenceDescriptor[a as keyof DBPreferenceMap]
        if (descriptor.type === PreferenceType.Dropdown)
            return Number(_.findKey(descriptor.details, j => j === i));
        else if (descriptor.type === PreferenceType.Checkbox || descriptor.type === PreferenceType.Toggle)
            return [i].flat().pop() === 'on';
        return converters[typeof defaultPreferences[a as keyof DBPreferenceMap]](i);
    }) as DBPreferenceMap;
}

export async function writePreferences(pref: Partial<DBPreferenceMap>, userToken: string): Promise<void> {
    try {
        const preferenceKeys: string[] = (await sql.sql_all<{ column_name: string }>(`select column_name
                                                                                      from information_schema.columns
                                                                                      where table_name = 'user_preferences'`)).map(i => i.column_name).filter(i => i in pref);

        const query = `update user_preferences
                       set ${preferenceKeys.map((i, a) => `"${i}" = $${a + 1}`).join(', ')}
                       where "userId" = (select "userId" from users where "userToken" = $${preferenceKeys.length + 1})`;
        return void await sql.sql_query(query, [...preferenceKeys.map(i => pref[i as keyof DBPreferenceMap]), userToken] as SQLInjectType);
    } catch (err) {
        console.error(err);
    }
}