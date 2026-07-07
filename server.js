import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));

// しあtubeの規制スルー機能付きコアHTMLをGitHubから動的に取得して配信するエンドポイント
app.get('/siatube-core', (req, res) => {
    const targetUrl = 'https://raw.githubusercontent.com/ajgpw/youtube/refs/heads/main/index.html.txt';
    
    https.get(targetUrl, (githubRes) => {
        if (githubRes.statusCode !== 200) {
            return res.status(500).send('しあtubeコアの取得に失敗しました。');
        }
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        githubRes.pipe(res);
    }).on('error', (e) => {
        console.error(e);
        res.status(500).send('通信エラーが発生しました。');
    });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
