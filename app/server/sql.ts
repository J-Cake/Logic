import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import {rootFn} from "./utils";

export const Users = (async res => new (sqlite3.verbose().Database)(path.join(await rootFn(), 'Data/Users')))();

export type SQLValue = string | number | boolean | Date;
export type SQLInjectType = {[key: string]: SQLValue} | SQLValue[];

export default {
    sql_each<Data extends {}>(query: string, placeholders?: SQLInjectType): Promise<Data> {
        return new Promise(async function (resolve, reject) {
            (await Users).each(query, placeholders, function(err, data) {
                if (err)
                    return reject(err);
                resolve(data);
            });
        });
    },
    sql_query(query: string, placeholders?: SQLInjectType): Promise<void> {
        return new Promise(async function (resolve, reject) {
            (await Users).run(query, placeholders, function (err) {
                if (err)
                    return reject(err);
                resolve();
            })
        });
    },
    sql_get<Data extends {}>(query: string, placeholders?: SQLInjectType): Promise<Data> {
        return new Promise(async function (resolve, reject) {
            (await Users).get(query, placeholders, function(err, data) {
                if (err)
                    return reject(err);
                resolve(data);
            });
        });
    },
    sql_all<Data extends {}>(query: string, placeholders?: SQLInjectType): Promise<Data[]> {
        return new Promise(async function (resolve, reject) {
            (await Users).all(query, placeholders, function(err, data) {
                if (err)
                    return reject(err);
                resolve(data as unknown as Data[]);
            });
        });
    },
}