import express from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;

async function createPadletPost() {
    const BOARD_ID = 'wy32bauth9n4npi1'; 
    const SECTION_ID = 'sec_J7pj4ol5wLdX2KMG';
    
    // APIキーの読み込み
    const API_KEY = process.env.PADLET_API_KEY;
    const url = `https://api.padlet.dev/v1/boards/${BOARD_ID}/posts`;

    const payload = {
        "data": {
            "type": "post",
            "attributes": {
                "content": {
                    "subject": "自動投稿テスト",
                    "body": "ブラウザ模倣モードで投稿"
                },
                "color": "blue"
            },
            "relationships": {
                "section": {
                    "data": { "id": SECTION_ID, "type": "section" }
                }
            }
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/vnd.api+json',
                'Accept': 'application/vnd.api+json',
                // 重要: ブラウザからのアクセスに見せるためのヘッダー
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Origin': 'https://padlet.com',
                'Referer': `https://padlet.com/corkdowryashen/board_${BOARD_ID}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (response.status === 201) {
            console.log('✅ 投稿成功!', result);
        } else {
            console.error('❌ 投稿失敗 (ステータスコード ' + response.status + '):', JSON.stringify(result, null, 2));
        }
    } catch (error) {
        console.error('⚠️ 通信エラー:', error.message);
    }
}

createPadletPost();

app.get('/', (req, res) => res.send('Bot is running'));
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
