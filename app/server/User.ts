import sql from "./sql";

export default class User {
    constructor(userId: number) {

    }
}

export async function verifyUser(userToken?: string): Promise<boolean> {
    return !!userToken && !!await sql.sql_get(`SELECT userId from users where userToken == ?`, [userToken]);
}