import express from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;

async function postToPadletInternal() {
    const url = "https://padlet.com/api/9/wishes";
    
    // RailwayのVariablesに設定してください
    const AUTH_BEARER = process.env.PADLET_AUTH_BEARER; 
    const CSRF_TOKEN = process.env.PADLET_CSRF_TOKEN;

    const payload = {
        "cid": "c_new12345",
        "wall_id": 266991839,
        "wall_section_id": 377956413,
        "subject": "自動投稿テスト",
        "body": "Node.jsから内部API経由で投稿しました",
        "published": true
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${AUTH_BEARER}`,
                "x-csrf-token": CSRF_TOKEN,
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('投稿結果:', result);
    } catch (e) {
        console.error('通信エラー:', e.message);
    }
}

// 実行
postToPadletInternal();

app.get('/', (req, res) => res.send('Bot is running'));
server.listen(PORT, '0.0.0.0');
