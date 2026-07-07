import fetch from 'node-fetch'; // npm install node-fetch が必要です

async function createPadletPost(boardId, sectionId, subject, body) {
    const apiKey = process.env.PADLET_API_KEY; // RailwayのVariablesから取得
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

        console.log('投稿成功:', result);
        return result;
    } catch (error) {
        console.error('投稿失敗:', error.message);
    }
}

// 使用例：サーバー起動時や特定のタイミングで呼び出す
// createPadletPost('あなたのボードID', 'あなたのセクションID', '自動投稿テスト', 'APIで作成しました！');
