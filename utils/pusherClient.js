import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "1993072",
  key: process.env.PUSHER_KEY || "04b459376799d9c622c3",
  secret: process.env.PUSHER_SECRET || "d3776dd2a46a32da59d4",
  cluster: process.env.PUSHER_CLUSTER || "ap2",
  useTLS: true,
});

export default pusher;
