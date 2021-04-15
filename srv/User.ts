import type * as express from 'express';
import sql, {SQLInjectType} from "./sql";
import {DBPreferenceMap} from "./getFile";
import {defaultPreferences, PreferenceDescriptor, PreferenceType} from "../app/src/Enums";
import * as _ from 'lodash'

export async function verifyUser(userToken?: string): Promise<boolean> {
    // console.log(userToken, !!userToken, await sql.sql_get(`SELECT userId from users where userToken == ?`, [userToken || ""]))
    return !!userToken && !!await sql.sql_get(`SELECT userId
                                               from users
                                               where userToken == ?`, [userToken || ""]);
}

export function isLoggedIn(req: express.Request): boolean {
    return Boolean((req.cookies.userId ?? req.header("userId")) ?? req.userId);
}

export async function getPreferencesForUser(userToken: string): Promise<DBPreferenceMap> {
    const pref: DBPreferenceMap = await sql.sql_get<DBPreferenceMap>(`SELECT *
                                                                      from user_preferences
                                                                      where userId == (SELECT userId from users where userToken == ?)`, [userToken]);

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
        const params = _.mapKeys({...pref, userId: userToken}, (i, a) => `$${a}`) as SQLInjectType;
        return void await sql.sql_query(`update user_preferences set ${Object.keys(pref).map(i => `${i} = $${i}`)} where userId == (select userId from users where userToken == $userId)`, params);
    } catch (err) {
        console.error(err);
    }
}