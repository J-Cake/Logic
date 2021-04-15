import * as $ from 'jquery';
import * as mousetrap from 'mousetrap';

mousetrap.bind('esc', () => window.close());

const circuitId = window.location.href.split('/').pop();

export async function update(this: HTMLElement) {
    const users: {
        users: {
            email: string,
            identifier: string,
            userId: number,
            dateGranted: number,
            canEdit: boolean
        }[]
    } = await (await fetch(`/search-users?q=${encodeURIComponent($(this).val() as string).trim()}`)).json();

    const results = $("#results");
    results.empty();

    for (const i of users.users)
        results.append(`<div class="user" data-user-id="${i.userId}">
                <span class="name">${i.identifier}</span>
                <span class="email">${i.email}</span>            
            </div>`);
    $(".user").on('click', function () {
        fetch(`/circuit/${circuitId}/collaborator?user=${$(this).data('user-id')}`, {method: 'put'})
            .then(_ => window.location.reload());
    });
}

$("#searchField").on('input', function () {
    update.bind(this)();
});

$(".rem-usr").on('click', function () {
    fetch(`/circuit/${circuitId}/collaborator?user=${$(this).data('user-id')}`, {method: 'delete'}).then(_ => window.location.reload());
});

$(".can-edit").on('change', function() {
    fetch(`/circuit/${circuitId}/collaborator?user=${$(this).data('user-id')}&can-edit=${$(this).prop('checked') ? 'true' : 'false'}`, {method: 'put'})
        .then(res => !res.ok ? alert('Failed to update document') : void 0);
});