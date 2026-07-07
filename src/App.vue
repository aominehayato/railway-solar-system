<template>
  <div style="max-width: 800px; margin: auto; padding: 20px;">
    <h1>しあTube</h1>
    <input v-model="url" placeholder="YouTube URL" style="width: 100%; padding: 10px;">
    <button @click="play" style="margin-top: 10px; width: 100%; padding: 10px;">再生</button>
    <p>{{ msg }}</p>
    <video ref="vid" controls autoplay style="width: 100%; margin-top: 20px;"></video>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const url = ref(''), msg = ref(''), vid = ref(null);
const play = async () => {
  msg.value = '接続試行中...';
  const id = url.value.split(/v=|shorts\//)[1]?.substring(0, 11);
  if (!id) { msg.value = 'URLが不正です'; return; }
  try {
    const res = await fetch('/api/bypass-stream?id=' + id);
    const data = await res.json();
    if (data.success) {
      vid.value.src = data.streamUrl;
      msg.value = '再生中: ' + data.title;
    } else {
      msg.value = '取得失敗: 外部サーバーが拒否されました。';
    }
  } catch (e) { msg.value = '接続エラー'; }
};
</script>
