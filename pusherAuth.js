import express from "express";
import Pusher from "pusher";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const pusher = new Pusher({
  appId: "1993072",
  key: "04b459376799d9c622c3",
  secret: "d3776dd2a46a32da59d4",
  cluster: "ap2",
  useTLS: true,
});

// Pusher authentication endpoint
app.post("/pusher/auth", (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;

  // Optionally check if user is authorized to subscribe to this channel
  const auth = pusher.authenticate(socketId, channel);
  res.send(auth);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Pusher auth server running on port ${PORT}`);
});
