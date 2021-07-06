import $ from 'jquery';
import mousetrap from 'mousetrap';
import {removeComponent} from "../document-editor/sys/API/circuit";
import {Status} from "../../server/API/lib/Api";

mousetrap.bind('esc', () => window.close());

const connect: typeof window.connect = () => window.opener?.connect?.() ?? (() => alert('No way to connect'));

new Promise<(msgFn: string) => void>(ok => ok(connect())).then(function (msgFn) {
    $(".component").on('click', function () {
        return msgFn($(this).find('.token').text());
    });

    $("button.remove").on('click', function (e) {
        e.stopPropagation();

        // TODO: Inform editor of change

        const token = location.pathname.split('/').pop()
        if (token)
            removeComponent(token, $(this).data('comp')).then(res => {
                console.log(res);
                if ([Status.Done, Status.No_Change, Status.Undefined].includes(res.status))
                    window.location.reload()
                else
                    alert(`Err: ${Status[res.status]}`);
            })
    })
});