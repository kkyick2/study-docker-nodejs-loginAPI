const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");

const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_IP,
  MONGO_PORT,
  REDIS_URL,
  SESSION_SECRET,
  REDIS_PORT,
} = require("./config/config");

const { createClient } = require("redis")
let RedisStore = require("connect-redis")(session);

let redisClient = createClient({ 
  url: REDIS_URL + ":"+ REDIS_PORT,
  legacyMode: true 
})
console.log("connect to redis: " + REDIS_URL + ":"+ REDIS_PORT)
redisClient.connect().catch(console.error)

const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");
const app = express();

const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`;
mongoose.set('strictQuery', true)
const connectWithRetry = () => {
  mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to db: " + mongoURL))
  .catch((err) => {
    console.log(err);
    setTimeout(connectWithRetry, 5000);
  });
};
connectWithRetry();
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    cookie: {
      secure: false,
      resave: false,
      saveUninitialized: false,
      httpOnly: true,
      maxAge: 60000, //60s
    },
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("<h2>root</h2>");
  console.log("/ running");
});

//localhost:3001/api/v1/post/
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`listening on port ${port}`));