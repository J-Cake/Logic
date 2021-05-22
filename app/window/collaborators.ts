import $ from 'jquery';
import mousetrap from 'mousetrap';
import {searchUsers} from "../src/sys/API/user";
import {addCollaborator, allowEdit, removeCollaborator} from "../src/sys/API/circuit";
import type {userSearch} from "../../server/API/UserRouter";

mousetrap.bind('esc', () => window.close());

const circuitToken: string = window.location.href.split('/').pop() as string;

export async function update(this: HTMLElement) {
    const users: userSearch = (await searchUsers(encodeURIComponent(($(this).val() as string).trim()))).data;

    const results = $("#results");
    results.empty();

    for (const i of users.users)
        results.append(`<div class="user" data-user-id="${i.userId}">
                <span class="name">${i.identifier}</span>
                <span class="email">${i.email}</span>            
            </div>`);
    $(".user").on('click', function () {
        addCollaborator(circuitToken, $(this).data('user-id'));
        // fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}/collaborator?user=${$(this).data('user-id')}`, {
        //     method: 'put',
        //     headers: {
        //         'auth-token': document.cookie.split(';').find(i => /^auth-token=.+$/)?.split('=')[0] ?? ''
        //     }
        // }).then(_ => window.location.reload());
    });
}

$("#searchField").on('input', function () {
    update.bind(this)();
});

$(".rem-usr").on('click', async function () {
    await removeCollaborator(circuitToken, $(this).data('user-id'));
});

$(".can-edit").on('change', async function () {
    await allowEdit(circuitToken, $(this).data('user-id') as string, $(this).prop('checked'));
});