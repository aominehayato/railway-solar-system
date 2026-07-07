import express from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;

// API投稿処理
async function createPadletPost() {
    const BOARD_ID = '266991839'; // あなたのボードID
    const SECTION_ID = '377956413'; // あなたのセクションID
    const API_KEY = process.env.PADLET_API_KEY;

    const url = `https://api.padlet.dev/v1/boards/${BOARD_ID}/posts`;

    // 公式仕様に基づくリクエストボディ
    const payload = {
        "data": {
            "type": "post",
            "attributes": {
                "content": {
                    "subject": "自動投稿",
                    "body": "API経由でテスト投稿中"
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
                'X-API-KEY': API_KEY, // 公式指定の認証ヘッダー
                'Content-Type': 'application/vnd.api+json', // 公式指定のContent-Type
                'Accept': 'application/vnd.api+json'       // 公式指定のAccept
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

// 起動時に1回だけ実行
createPadletPost();

app.get('/', (req, res) => res.send('Bot is running'));
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
