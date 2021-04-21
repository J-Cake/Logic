import path from 'path';
import url from "url";

import pg from 'pg';
import {Try} from '../../app/util';

import {devMode} from '../';

export type SQLValue = string | number | boolean | Date;
// export type SQLInjectType = { [key: string]: SQLValue } | SQLValue[];

export type SQLInjectType = SQLValue[];

export interface SQL_FN {
    sql_each<Data extends {}>(query: string, placeholders?: SQLInjectType): Promise<Data>

    sql_query(query: string, placeholders?: SQLInjectType): Promise<void>

    sql_get<Data extends {}>(query: string, placeholders?: SQLInjectType): Promise<Data>

    sql_all<Data extends {}>(query: string, placeholders?: SQLInjectType): Promise<Data[]>
}

const pgPool = new pg.Pool();

pgPool.on('error', err => {
    throw err;
});

const parseStack = function (): string {
    const err = new Error().stack;

    if (err) {
        const lines = err.split('\n').map(i => i.match(/((?:[a-zA-Z]:|..|.|~)?(?:[\\\/].+?)+)\)?$/)?.pop()).filter(i => i) as string[];
        return lines.find(i => !i.includes(path.parse(url.fileURLToPath(import.meta.url)).name)) ?? lines[0];
    }

    return '';
}

export default {
    sql_query(query: string, placeholders?: SQLInjectType): Promise<void> {
        const caller = parseStack();

        return Try(async function () {
            const client = await pgPool.connect();
            await client.query(query, placeholders);
            await client.release();
        }).catch(err => {
            if (devMode)
                console.error(`SQLError - ${err.message}\n  `, caller, '\n  ', query);
            throw `SQLError - ${err.message}`;
        });
    },
    sql_get<Data extends {}>(query: string, placeholders?: SQLInjectType): Promise<Data> {
        const caller = parseStack();

        return Try(async function (): Promise<Data> {
            const client = await pgPool.connect();
            const result = await client.query<Data>(query, placeholders);
            await client.release();
            return result.rows[0];
        }).catch(err => {
            if (devMode)
                console.error(`SQLError - ${err.message}\n  `, caller, '\n  ', query);
            throw `SQLError - ${err.message}`;
        });
    },
    sql_all<Data extends {}>(query: string, placeholders?: SQLInjectType): Promise<Data[]> {
        const caller = parseStack();

        return Try(async function (): Promise<Data[]> {
            const client = await pgPool.connect();
            const result = await client.query<Data>(query, placeholders);
            await client.release();
            return result.rows;
        }).catch(err => {
            if (devMode)
                console.error(`SQLError - ${err.message}\n  `, caller, '\n  ', query);
            throw `SQLError - ${err.message}`;
        });
    }
}