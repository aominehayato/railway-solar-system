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

app.use(express.static(path.join(__dirname, 'dist')));

// 2026年現在、高稼働・低規制の最新Piped APIエンドポイント
const PIPED_APIS = [
    'https://pipedapi-official.kavin.rocks',
    'https://pipedapi.colby.rocks',
    'https://pipedapi.us.to',
    'https://piped-api.lunar.icu',
    'https://pipedapi.oxand.co',
    'https://pipedapi.adminforge.de'
];

app.get('/api/bypass-stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) {
        return res.status(400).json({ success: false, error: '動画IDが指定されていません。' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    for (const apiBase of PIPED_APIS) {
        try {
            const targetUrl = `${apiBase}/streams/${videoId}`;
            console.log(`[Proxy Trying] -> ${targetUrl}`);
            
            const data = await new Promise((resolve, reject) => {
                const options = {
                    timeout: 4000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json'
                    }
                };

                const request = https.get(targetUrl, options, (apiRes) => {
                    let body = '';
                    apiRes.on('data', chunk => body += chunk);
                    apiRes.on('end', () => {
                        if (apiRes.statusCode === 200) {
                            try {
                                resolve(JSON.parse(body));
                            } catch (e) {
                                reject(new Error('JSON Parse Failed'));
                            }
                        } else {
                            reject(new Error(`HTTP Status ${apiRes.statusCode}`));
                        }
                    });
                });
                
                request.on('error', reject);
                request.on('timeout', () => {
                    request.destroy();
                    reject(new Error('Timeout'));
                });
            });

            if (data && data.videoStreams && data.videoStreams.length > 0) {
                // 音声と映像がセットのストリームを優先取得
                const combinedStreams = data.videoStreams.filter(s => s.videoOnly === false);
                const bestStream = combinedStreams.length > 0 ? combinedStreams[0] : data.videoStreams[0];

                console.log(`[Proxy Success] 接続確立: ${apiBase}`);
                return res.json({
                    success: true,
                    title: data.title,
                    streamUrl: bestStream.url
                });
            }
        } catch (err) {
            console.warn(`[Proxy Bypassed] ${apiBase} 失敗: ${err.message}`);
        }
    }

    res.status(500).json({ 
        success: false, 
        error: 'すべての回避インスタンスが一時的にブロックされているか、応答がありません。別の動画URLを試すか、数分後に再度実行してください。' 
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server Core] Backend service activated on port ${PORT}`);
});
