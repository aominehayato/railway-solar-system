import fetch from 'node-fetch';

async function createPadletPost() {
    // 1. 設定値を入力
    const BOARD_ID = '266991839';      // あなたの wall_id
    const SECTION_ID = '377956413';    // あなたの wall_section_id
    const API_KEY = process.env.PADLET_API_KEY; // RailwayのVariablesに設定したもの

    const url = `https://api.padlet.dev/v1/boards/${BOARD_ID}/posts`;

    const payload = {
        "data": {
            "type": "post",
            "attributes": {
                "content": {
                    "subject": "自動投稿テスト",
                    "body": "APIで作成しました！"
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
                'Content-Type': 'application/json',
                'X-API-KEY': API_KEY // 公式APIの仕様に従ったヘッダー
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (response.status === 201) {
            console.log('✅ 投稿成功!', result);
        } else {
            console.error('❌ 投稿失敗:', JSON.stringify(result, null, 2));
        }
    } catch (error) {
        console.error('⚠️ 通信エラー:', error);
    }
}

createPadletPost();
