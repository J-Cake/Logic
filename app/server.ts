import * as path from 'path';

import * as express from 'express';
import * as sm from 'source-map-support';

sm.install();

const app = express();

app.use(express.static(path.join(process.cwd(), "./build/final")));
app.post('/app.html', function (req, res) {
    res.sendFile(path.join(process.cwd(), '/build/final/app.html'));
});

const port = Number(process.argv[2]) || 3500;
app.listen(port, function () {
    console.log('listening on port', port);
})
