// server.js (or auth.js)
import express from 'express';
import Pusher from 'pusher';

const app = express();
app.use(express.json());

const pusher = new Pusher({
  appId: "1993072",
  key: "04b459376799d9c622c3",
  secret: "d3776dd2a46a32da59d4",
  cluster: "ap2",
  useTLS: true,
});

app.post('/pusher/auth', (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;

  // **Add your auth logic here** - e.g. validate user/token to allow subscription

  const auth = pusher.authenticate(socketId, channel);
  res.send(auth);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
