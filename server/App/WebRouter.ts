import path from 'path';

import express from 'express';
import MarkdownIt from 'markdown-it';

import {rootFn} from '../util/utils';
import * as FS from '../util/files';
import {isLoggedIn} from './Auth/UserActions';

const comp = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
});

const router: express.Router = express.Router();

router.get('/', function (req, res) {
    res.render('site/home', {
        title: "LogicX",
        isLoggedIn: isLoggedIn(req)
    });
});
router.get('/license', function (req, res) {
    res.render('site/license', {
        title: "LogicX License",
        isLoggedIn: isLoggedIn(req)
    });
});

type FS = {
    [item: string]: string | FS
}

const getPages = async function(root?: string): Promise<FS> {
    const docRoot = path.join(await rootFn(), 'lib/doc/wiki', root ? root : '');

    const dir = async function (dirName: string): Promise<FS> {
        const docs: FS = {};

        for (const i of (await FS.readdir(dirName)).filter(i => !i.startsWith('~$')))
            if ((await FS.stat(path.join(dirName, i))).isDirectory())
                docs[i] = await dir(path.join(dirName, i));
            else if (i.split('.').pop() === 'md')
                docs[i] = ''

        return docs;
    }

    return dir(docRoot);
};

router.get('/wiki/:page', async function(req, res) {
    const doc = path.join(await rootFn(), 'lib/doc/wiki', decodeURIComponent(req.params.page));

    if (await FS.exists(doc) && (await FS.stat(doc)).isFile() && doc.split('.').pop() === 'md')
        res.render('site/wiki', {
            content: comp.render(await FS.readFile(doc)),
            pages: await getPages(),
            isLoggedIn: isLoggedIn(req)
        });
    else if (await FS.exists(doc) && (await FS.stat(doc)).isDirectory())
        res.render('site/wiki', {
            pages: await getPages(req.params.page),
            isLoggedIn: isLoggedIn(req)
        });
    else
        res.render('site/404', {
            isLoggedIn: isLoggedIn(req)
        });
})

router.get('/wiki', async function(req, res) {
    res.render('site/wiki', {
        pages: await getPages(),
        isLoggedIn: isLoggedIn(req)
    });
});

export default router;