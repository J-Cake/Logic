import path from 'path';
import express from 'express';

import {dirs, rootFn} from '../util/utils';
import * as FS from '../util/files';

const router: express.Router = express.Router();

router.get('/svg/:file', async function (req, res) {
    res.sendFile(path.join(await rootFn(), 'lib', 'res', req.params.file));
})

router.get('/folio.html', function (req, res) {

});

router.get('/slideshow', async function (req: express.Request, res: express.Response) {
    const loc = path.join(dirs.res, 'slideshow');
    const files = await FS.readdir(loc);

    const fileExtensions = ['.png', 'jpg', '.jpeg', '.svg'];
    const images = files.filter(i => fileExtensions.some(j => i.toLowerCase().endsWith(j.toLowerCase())));

    const file = images[Math.floor(Math.random() * images.length)];

    res.sendFile(path.join(loc, file));
});

router.get('/video/:file', function (req, res) {
    res.sendFile(path.join(dirs.res, 'video', req.params.file));
});

router.use('/', async function (req: express.Request, res: express.Response) {
    const resource = path.resolve(path.join(dirs.res, req.path));

    if (resource.startsWith(dirs.root) && await FS.exists(resource) && (await FS.stat(resource)).isFile())
        res.sendFile(resource);
    else
        res.status(404).end('Error 404: Not found');
});


export default router;