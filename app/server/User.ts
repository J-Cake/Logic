import type * as express from 'express';
import sql from "./sql";

export async function verifyUser(userToken?: string): Promise<boolean> {
    // console.log(userToken, !!userToken, await sql.sql_get(`SELECT userId from users where userToken == ?`, [userToken || ""]))
    return !!userToken && !!await sql.sql_get(`SELECT userId from users where userToken == ?`, [userToken || ""]);
}

export function isLoggedIn(req: express.Request): boolean {
    return Boolean((req.cookies.userId ?? req.header("userId")) ?? req.userId);
}