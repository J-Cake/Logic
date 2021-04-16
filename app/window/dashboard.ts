import * as $ from 'jquery';
import * as mousetrap from 'mousetrap';

mousetrap.bind('esc', () => window.close());

$('.controls *').each(function () {
    $(this).on('click', function (e) {
        e.stopPropagation();
        return false;
    });
})
$('#mkDoc').on('click', async function () {
    const name = prompt('Please enter a document name');
    if (name) {
        const token = await fetch(`/make?name=${name}`, {method: 'post'});
        if (token.ok)
            window.location.href = `/edit/${await token.text()}`;
        // window.location.href = `/make?name=${name}`;
    }
});
$('.doc').each(function () {
    const i = $(this);
    i.find('a').on('mouseover', () => {
        i.css('background', `var(--blank)`);
        i.css('color', `var(--background)`);
    });
    i.find('a').on('mouseout', () => {
        i.css('background', `initial`);
        i.css('color', `var(--blank)`);
    });
});
$('.deleteDoc').each(function () {
    const i = $(this);
    i.on('click', () => confirm("Are you sure you want to delete this document?") ? fetch(i.data('url'), {method: 'DELETE'}).then(i => window.location.reload()) : null);
});
$('.collab').each(function () {
    const i = $(this);
    i.on('click', () => window.open(`/collab/${i.data('doc')}`, '_blank', 'location=no,height=450,width=450,scrollbars=no,status=no'));
});
$(".editName").on("click", function() {
    fetch(`/circuit/${$(this).data('doc')}?name=${prompt("Enter a new name")}`, {method: 'post'}).then(_ => window.location.reload());
});
$(".leaveDoc").on('click', function() {
    fetch(`/circuit/${$(this).data('doc')}/leave`, {method: 'delete'}).then(_ => window.location.reload());
});