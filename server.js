import express from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;

async function createPadletPost() {
    const BOARD_ID = '266991839'; 
    const SECTION_ID = '377956413';
    
    // 変数名は指示通り PADLET_API_KEY を使用
    const API_KEY = process.env.PADLET_API_KEY;

    const url = `https://api.padlet.dev/v1/boards/${BOARD_ID}/posts`;

    const payload = {
        "data": {
            "type": "post",
            "attributes": {
                "content": {
                    "subject": "自動投稿テスト",
                    "body": "APIキーによる投稿"
                },
                "color": "blue"
            },
            "relationships": {
                "section": {
                    "data": { "id": SECTION_ID }
                }
            }
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                // 公式仕様に従い X-API-KEY を使用
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/vnd.api+json',
                'Accept': 'application/vnd.api+json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (response.status === 201) {
            console.log('✅ 投稿成功!', result);
        } else {
            // エラー詳細を全て出力
            console.error('❌ 投稿失敗 (ステータスコード ' + response.status + '):', JSON.stringify(result, null, 2));
        }
    } catch (error) {
        console.error('⚠️ 通信エラー:', error.message);
    }
}

createPadletPost();

app.get('/', (req, res) => res.send('Bot is running'));
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
