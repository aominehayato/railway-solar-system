import express from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;

// Padletへの投稿関数
async function createPadletPost(boardId, sectionId, subject, body) {
    const apiKey = process.env.PADLET_API_KEY;
    const url = `https://api.padlet.dev/v1/boards/${boardId}/posts`;

    const requestBody = {
        "data": {
            "type": "post",
            "attributes": {
                "content": {
                    "subject": subject,
                    "body": body
                },
                "color": "blue"
            },
            "relationships": {
                "section": {
                    "data": { "id": sectionId }
                }
            }
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': apiKey
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(`API Error: ${JSON.stringify(result)}`);
        }

        console.log('✅ 投稿成功:', result);
        return result;
    } catch (error) {
        console.error('❌ 投稿失敗:', error.message);
    }
}

// サーバー起動時に投稿を実行（テスト用）
// ※ board_id と section_id はご自身の環境のものに書き換えてください
const TEST_BOARD_ID = '266991839'; 
const TEST_SECTION_ID = '377956413';

createPadletPost(TEST_BOARD_ID, TEST_SECTION_ID, '自動投稿テスト', 'Node.js標準fetchで投稿しました！');

app.get('/', (req, res) => res.send('Bot is running'));
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
