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

// 世界中の安定したInvidiousインスタンスのリスト（負荷分散・生存確認用）
const INVIDIOUS_INSTANCES = [
    'https://invidious.yewtu.be',
    'https://inv.tux.it',
    'https://invidious.nerdvpn.de',
    'https://invidious.flokinet.to',
    'https://inv.riverside.rocks'
];

// YouTubeの動画IDを抽出するヘルパー
function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Invidious APIを経由して規制スルーのストリームURLを取得する
app.get('/api/stream-url', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: 'Missing url parameter' });

    const videoId = getYouTubeId(targetUrl);
    if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL' });

    // 生存しているInvidiousインスタンスからデータを取得できるまでループ試行
    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            const apiUrl = `${instance}/api/v1/videos/${videoId}`;
            
            const data = await new Promise((resolve, reject) => {
                https.get(apiUrl, { timeout: 3000 }, (apiRes) => {
                    let body = '';
                    apiRes.on('data', chunk => body += chunk);
                    apiRes.on('end', () => {
                        if (apiRes.statusCode === 200) resolve(JSON.parse(body));
                        else reject(new Error(`Status ${apiRes.statusCode}`));
                    });
                }).on('error', reject);
            });

            // 最も扱いやすいフォーマット形式（video/mp4または組み合わせストリーム）を抽出
            if (data && data.formatStreams && data.formatStreams.length > 0) {
                // 画質が最適で、映像と音声が合体しているストリームURLを選択
                const bestStream = data.formatStreams[data.formatStreams.length - 1];
                
                // クライアントが直接アクセス、またはプロキシ可能なストリームURLを返す
                return res.json({ 
                    streamUrl: bestStream.url,
                    title: data.title
                });
            }
        } catch (err) {
            console.log(`Instance ${instance} failed, trying next...`);
            // エラー時は次のインスタンスへ自動フォールバック
        }
    }

    res.status(500).json({ error: 'すべての回避サーバーが制限突破に失敗しました。時間をおいて試してください。' });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
