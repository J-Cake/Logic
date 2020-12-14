import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import {rootFn} from "./utils";

export const Users = new (sqlite3.verbose().Database)(path.join(rootFn(process.cwd()), 'Data/Users'))

export type SQLValue = string | number | boolean | Date;

export default {
    sql_each<Data extends {}>(query: string, placeholders?: SQLValue[]): Promise<Data> {
        return new Promise(function (resolve, reject) {
            Users.each(query, placeholders, function(err, data) {
                if (err)
                    return reject(err);
                resolve(data);
            });
        });
    },
    sql_query(query: string, placeholders?: SQLValue[]): Promise<void> {
        return new Promise(function (resolve, reject) {
            Users.run(query, placeholders, function (err) {
                if (err)
                    return reject(err);
                resolve();
            })
        });
    },
    sql_get<Data extends {}>(query: string, placeholders?: SQLValue[]): Promise<Data> {
        return new Promise(function (resolve, reject) {
            Users.get(query, placeholders, function(err, data) {
                if (err)
                    return reject(err);
                resolve(data);
            });
        });
    },
    sql_all<Data extends {}>(query: string, placeholders?: SQLValue[]): Promise<Data> {
        return new Promise(function (resolve, reject) {
            Users.all(query, placeholders, function(err, data) {
                if (err)
                    return reject(err);
                resolve(data as unknown as Data);
            });
        });
    },
}