import path from "path";

import express from 'express';

import * as FS from '../util/files'
import {attempt, rootFn} from "../util/utils";
import {isLoggedIn} from "./Auth/UserActions";
import MarkdownIt from "markdown-it";
import find from "../util/find";

type FS = {
    [item: string]: string | FS
}
const comp = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
});

const router: express.Router = express.Router();

const getPages = async function (root?: string): Promise<FS> {
    const docRoot = path.join(await rootFn(), 'lib/doc/wiki/', root ? root : '').replace(/\/{2,}/g, '/');

    const dir = async function (dirName: string): Promise<FS> {
        const docs: FS = {};

        for (const i of (await FS.readdir(dirName)).filter(i => !i.startsWith('~$')))
            if ((await FS.stat(path.join(dirName, i))).isDirectory())
                docs[i] = await dir(path.join(dirName, i).replace(/\/{2,}/g, '/'));
            else if (i.split('.').pop() === 'md')
                docs[i] = ''

        return docs;
    }

    return dir(docRoot);
};

router.get('/', async function (req, res) {
    res.render('site/wiki', {
        pages: await getPages(),
        path: decodeURIComponent('/'),
        isLoggedIn: isLoggedIn(req)
    });
});

router.get('/search', async function (req, res) {
    if (req.query.q && await attempt(async function () {
        const results: [preview: string, file: string][] = [];

        for await (const i of find((req.query.q as string).replace('+', ' '))) {
            results.push([comp.render(i[0]), i[1]]);
            console.log(results[results.length - 1][0]);
        }

        res.render('search-results', {
            results: results,
            isLoggedIn: isLoggedIn(req)
        });
    }))
        res.render('search-results', {
            results: [],
            isLoggedIn: isLoggedIn(req)
        });
})

router.use(async function (req, res) {
    const doc = path.join(await rootFn(), 'lib/doc/wiki', decodeURIComponent(req.path).toLowerCase()).replace(/\/{2,}/g, '/');

    if (await FS.exists(doc) && (await FS.stat(doc)).isFile() && doc.split('.').pop() === 'md')
        res.render('site/wiki', {
            content: comp.render(await FS.readFile(doc)),
            pages: await getPages(),
            path: req.path,
            isLoggedIn: isLoggedIn(req),
            title: req.path,
            page: req.path
        });
    else if (await FS.exists(doc) && (await FS.stat(doc)).isDirectory())
        res.render('site/wiki', {
            pages: await getPages(req.path),
            isLoggedIn: isLoggedIn(req),
            title: req.path,
            page: req.path
        });
    else
        res.render('site/404', {
            isLoggedIn: isLoggedIn(req)
        });
})

export default router;