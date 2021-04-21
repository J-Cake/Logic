import {authToken} from "./index";

export function searchUsers(query: string) {
    return new Promise(resolve => {
        fetch(`${window.location.protocol}//api.${window.location.host}/user/search-users?q=${query}`, {
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => resolve(res));
    });
}

export function getPreferences() {
    return new Promise(resolve => {
        fetch(`${window.location.protocol}//api.${window.location.host}/user/preferences`, {
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => resolve(res));
    });
}