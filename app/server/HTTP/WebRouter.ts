import * as fs from 'fs';
import * as path from 'path';

import * as express from 'express';
import * as MarkdownIt from 'markdown-it';
import {rootFn} from "../utils";

const comp = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
});

const router: express.Router = express.Router();

router.get('/', function (req, res) {
    res.render('site/home', {title: "LogicX"});
});
router.get('/license', function (req, res) {
    res.render('site/license', {title: "LogicX License"});
});
router.get('/tryit', function (req, res) {
    res.render('app', {circuit: null});
});

type FS = {
    [item: string]: string | FS
}

const getPages = (function(root?: string): FS {
    const docRoot = path.join(rootFn(process.cwd()), 'doc/wiki', root ? root : '');

    const dir = (dirName: string): FS => {
        const docs: FS = {};

        for (const i of fs.readdirSync(dirName))
            if (fs.statSync(path.join(dirName, i)).isDirectory())
                docs[i] = dir(path.join(dirName, i));
            else if (i.split('.').pop() === 'md')
                docs[i] = ''

        return docs;
    }

    return dir(docRoot);
});

router.get('/wiki/:page', function(req, res) {
    const doc = path.join(rootFn(process.cwd()), 'doc/wiki', decodeURIComponent(req.params.page));

    console.log(doc);

    if (fs.existsSync(doc) && fs.statSync(doc).isFile() && doc.split('.').pop() === 'md')
        res.render('site/wiki', {
            content: comp.render(fs.readFileSync(doc).toString()),
            pages: getPages()
        });
    else if (fs.existsSync(doc) && fs.statSync(doc).isDirectory())
        res.render('site/wiki', {pages: getPages(req.params.page)});
    else
        res.render('site/404');
})

router.get('/wiki', function(req, res) {
    const doc = path.join(rootFn(process.cwd()), 'doc/wiki', 'index.md');
    res.render('site/wiki', {pages: getPages()});
});

// router.get('/docs/:page')

export default router;