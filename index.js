const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.json());

const LINE_TOKEN = process.env.LINE_ACCESS_TOKEN;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

app.post('/webhook', async (req, res) => {
  const event = req.body.events?.[0];
  if (!event || event.type !== 'message') return res.sendStatus(200);

  const userText = event.message.text;

  const gptReply = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: userText }]
    })
  }).then(res => res.json());

  const replyText = gptReply.choices?.[0]?.message?.content || '抱歉，我無法回應您的問題。';

  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LINE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: replyText }]
    })
  });

  res.sendStatus(200);
});

app.get('/', (req, res) => {
  res.send('LINE GPT Bot is running!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
