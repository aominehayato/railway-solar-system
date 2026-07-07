<template>
  <div id="player-app">
    <header class="app-header">
      <h1>しあTube</h1>
      <p class="subtitle">広告なし・追跡なしの日本向けYouTube匿名視聴サービス</p>
    </header>

    <main class="main-content">
      <div class="search-box">
        <input 
          type="text" 
          v-model="inputUrl" 
          placeholder="YouTubeの動画URL、またはShortsのURLを入力..." 
          @keyup.enter="handleParse"
        />
        <button @click="handleParse" :disabled="loading">
          {{ loading ? '解析中...' : '再生開始' }}
        </button>
      </div>

      <div v-if="statusMessage" class="status-banner" :class="{ 'error': isError }">
        {{ statusMessage }}
      </div>

      <div class="video-container">
        <video 
          ref="videoPlayer"
          controls 
          autoplay 
          playsinline 
          crossorigin="anonymous"
        ></video>
      </div>
    </main>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'App',
  setup() {
    const inputUrl = ref('');
    const statusMessage = ref('動画URLを入力してください。');
    const loading = ref(false);
    const isError = ref(false);
    const videoPlayer = ref(null);

    const extractVideoId = (url) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleParse = async () => {
      if (!inputUrl.value) {
        isError.value = true;
        statusMessage.value = 'URLを入力してください。';
        return;
      }

      const id = extractVideoId(inputUrl.value);
      if (!id) {
        isError.value = true;
        statusMessage.value = '有効なYouTube動画IDが見つかりませんでした。';
        return;
      }

      loading.value = true;
      isError.value = false;
      statusMessage.value = 'サーバーサイドで制限をバイパス中...';

      try {
        // 重要: 外部APIを直接叩かず、CORSを回避するために自作サーバーのプロキシAPIを呼び出す
        // 開発環境でも本番環境でも、ドメイン無しの相対パスでリクエストを中継させます
        const response = await fetch(`/api/bypass-stream?id=${id}`);
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTPエラーが発生しました (Status: ${response.status})`);
        }

        const data = await response.json();

        if (data.success && data.streamUrl) {
          statusMessage.value = `再生中: ${data.title}`;
          
          if (videoPlayer.value) {
            videoPlayer.value.src = data.streamUrl;
            videoPlayer.value.load();
            videoPlayer.value.play().catch(() => {
              statusMessage.value = `再生準備完了: ${data.title} (プレイヤーの再生ボタンを押してください)`;
            });
          }
        } else {
          throw new Error(data.error || '動画ストリームURLの解析に失敗しました。');
        }
      } catch (err) {
        isError.value = true;
        statusMessage.value = err.message || '通信エラーまたはサーバーエラーが発生しました。';
        console.error('[App Error]', err);
      } finally {
        loading.value = false;
      }
    };

    return {
      inputUrl,
      statusMessage,
      loading,
      isError,
      videoPlayer,
      handleParse
    };
  }
};
</script>

<style scoped>
#player-app {
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 20px;
}
.app-header {
  text-align: center;
  margin-bottom: 35px;
}
.app-header h1 {
  font-size: 32px;
  color: var(--link-color);
  margin: 0 0 10px 0;
  letter-spacing: 1px;
}
.subtitle {
  font-size: 14px;
  color: #bbb;
  margin: 0;
}
.search-box {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
input[type="text"] {
  flex: 1;
  background: #222;
  border: 1px solid #444;
  color: #fff;
  padding: 14px 18px;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}
input[type="text"]:focus {
  border-color: var(--link-color);
}
button {
  background: var(--link-color);
  color: #fff;
  border: none;
  padding: 0 28px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}
button:hover:not(:disabled) {
  background: #cc0000;
}
button:disabled {
  background: #555;
  cursor: not-allowed;
}
.status-banner {
  background: rgba(255, 0, 0, 0.1);
  color: #ff4d4d;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 25px;
  border-left: 4px solid var(--link-color);
}
.status-banner:not(.error) {
  background: rgba(255, 255, 255, 0.05);
  color: #ccc;
  border-left-color: #666;
}
.video-container {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 15px 40px rgba(0,0,0,0.8);
}
video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
