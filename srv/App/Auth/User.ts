import {DBPreferenceMap} from "../Document/getFile";
import {getPreferencesForUser} from "./UserActions";
import sql from "../../util/sql";

export interface JSONUser {
    userToken: string,
    email: string
}

export default class User {
    userToken: string;
    constructor(userToken: string) {
        this.userToken = userToken;
    }

    async prepareJSON(): Promise<JSONUser> {
        return {
            userToken: this.userToken,
            email: await sql.sql_get(`SELECT email from users where "userId" = (select "userId" from users where "userToken" = $1)`, [this.userToken])
        };
    }

    async getPreferences(): Promise<DBPreferenceMap> {
        return await getPreferencesForUser(this.userToken);
    }
}