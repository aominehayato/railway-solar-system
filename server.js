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

// ビルド済みスタティックファイルの配信
app.use(express.static(path.join(__dirname, 'dist')));

// CORSポリシーエラーを回避するため、サーバー側で中継を行う安定したPiped APIリスト
const PIPED_APIS = [
    'https://pipedapi.oxand.co',
    'https://pipedapi.adminforge.de',
    'https://pipedapi.r6.click',
    'https://api.piped.projectsegfau.lt'
];

app.get('/api/bypass-stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) {
        return res.status(400).json({ success: false, error: '動画IDが指定されていません。' });
    }

    // すべてのオリジンからのCORSを明示的に許可
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    for (const apiBase of PIPED_APIS) {
        try {
            const targetUrl = `${apiBase}/streams/${videoId}`;
            console.log(`[Proxy Fetch] ターゲットURLにリクエスト中: ${targetUrl}`);
            
            const data = await new Promise((resolve, reject) => {
                const request = https.get(targetUrl, { timeout: 5000 }, (apiRes) => {
                    let body = '';
                    apiRes.on('data', chunk => body += chunk);
                    apiRes.on('end', () => {
                        if (apiRes.statusCode === 200) {
                            try {
                                resolve(JSON.parse(body));
                            } catch (e) {
                                reject(new Error('JSON解析エラー'));
                            }
                        } else {
                            reject(new Error(`ステータスコード: ${apiRes.statusCode}`));
                        }
                    });
                });
                
                request.on('error', reject);
                request.on('timeout', () => {
                    request.destroy();
                    reject(new Error('タイムアウト（5秒）'));
                });
            });

            if (data && data.videoStreams && data.videoStreams.length > 0) {
                // 音声付きのストリームを優先的に抽出
                const combinedStreams = data.videoStreams.filter(s => s.videoOnly === false);
                const bestStream = combinedStreams.length > 0 ? combinedStreams[0] : data.videoStreams[0];

                console.log(`[Proxy Success] ストリームの取得に成功しました。 Instance: ${apiBase}`);
                return res.json({
                    success: true,
                    title: data.title,
                    streamUrl: bestStream.url
                });
            }
        } catch (err) {
            console.warn(`[Proxy Warning] ${apiBase} でのエラー: ${err.message}. 次のインスタンスへ移行します。`);
        }
    }

    res.status(500).json({ success: false, error: 'すべての回避サーバーが制限突破、または応答に失敗しました。時間をおいて再度お試しください。' });
});

// SPA用のフォールバックルート
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Backend Ready] CORS Bypass Server running on port ${PORT}`);
});
