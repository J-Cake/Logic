import {authToken} from "./index";
import {Action, ApiResponse_Success} from "../../../../server/API/lib/Api";
import {DBPreferenceMap} from "../../../../server/App/Document/getFile";
import type {userSearch} from "../../../../server/API/UserRouter";

/**
 * Fetch a list of users whose identifiers or emails are similar to the query
 * @param query the query to search for
 */
export function searchUsers(query: string): Promise<ApiResponse_Success<userSearch, Action.App_SearchUsers>> {
    return new Promise((resolve, reject) => {
        fetch(`${window.location.protocol}//api.${window.location.host}/user/search-users?q=${query}`, {
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => 'error' in res ? reject(res) : resolve(res));
    });
}

/**
 * Get the state of the users's preferences
 */
export function getPreferences(): Promise<ApiResponse_Success<DBPreferenceMap, Action.User_Get_Preferences>> {
    return new Promise((resolve, reject) => {
        fetch(`${window.location.protocol}//api.${window.location.host}/user/preferences`, {
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => 'error' in res ? reject(res) : resolve(res));
    });
}