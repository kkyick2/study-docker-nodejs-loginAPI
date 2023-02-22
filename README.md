# study-docker-nodejs-loginAPI

## Reference
* [DevOps with Docker and Node.js/Express: Development to production workflow + mongo + redis](https://www.youtube.com/watch?v=jotpVtFwYBk&t)
*[github](https://github.com/Sanjeev-Thiyagarajan/node-docker)

## Items
* Nodejs express
* Mongo
* Redis

---
# PART1 - Start project

```sh
npm init -y
npm install express
npm install nodemon --save-dev

### if nodemon cmd not found in linux
sudo npm list -g --depth=0
sudo npm install -g nodemon
```

index.js
```js
const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("<h2>Hi There</h2>");
    console.log("Index.js running");
  });

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`listening on port ${port}`));
```
### PART1.1 - start with docker cmd
Dockerfile
```sh
FROM node:18.14-alpine3.16
WORKDIR /app
COPY package.json .
RUN npm install
COPY . ./
ENV PORT 3001
EXPOSE $PORT
CMD ["npm", "dev", "run"]
```

```sh
docker build -t node-app-image .
docker run -p 3001:3001 -d --name node-app node-app-image
docker run -v %cd%:/app -v /app/node_modules ==env PORT=3001 -d --name node-app node-app-image
docker exec -it node-app bash

### remove docker
docker ps -a
docker images
docker volume ls
docker rm xxxxx -fv
docker image rm xxxxx
```
### PART1.2 - start with docker-compose.yml
* docker-compose.yml
```yml
version: "3"
services:
  node-app:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - ./:/app
      - /app/node_modules
    environment:
      - PORT=3001
    # env_file:
    #   - ./.env
```
```
docker-compose up -d
```

### PART1.3 - start with docker-compose.yml (prod vs dev)

Dockerfile
```sh
FROM node:18.14-alpine3.16
WORKDIR /app
COPY package.json .

ARG NODE_ENV
RUN if [ "$NODE_ENV" = "development" ]; \
        then npm install; \
        else npm install --only=production; \
        fi

COPY . ./
ENV PORT 3001
EXPOSE $PORT
CMD ["node", "index.js"]
```

* docker-compose.yml
```yml
version: "3"
services:
  node-app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
```

* docker-compose.dev.yml
```yml
version: "3"
services:
  node-app:
    build:
      context: .
      args:
        NODE_ENV: development
    volumes:
      - ./:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev
```

* docker-compose.prod.yml
```yml
version: "3"
services:
  node-app:
    build:
      context: .
      args:
        NODE_ENV: production
    environment:
      - NODE_ENV=production
    command: node index.js
```
* dev
```
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```
* prod
```
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

---
# PART2 - add mongo
* https://hub.docker.com/_/mongo

* docker-compose.yml
```yml
version: "3"
services:
  node-app:
    container_name: nodejs-loginapi
    build: .
    image: nodejs-loginapi:latest
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
  mongo:
    container_name: mongodb
    image: mongo:latest
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: P@ssw0rd123
```

```sh
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker exec -it study-docker-nodejs-loginapi_mongo_1 sh
mongosh -u "root" -p "Passw0rd"
db
show dbs
use mydb
db.books.insert({"name": "harry potter"})
db.books.find()
show dbs
exit
exit
docker exec -it mongodb mongosh -u "root" -p "Passw0rd"
# bring down the volume, will find the db is gone
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v 
```

* docker-compose.yml
```yml
version: "3"
services:
  node-app:
    container_name: nodejs-loginapi
    build: .
    image: nodejs-loginapi:latest
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
  mongo:
    container_name: mongodb
    image: mongo:latest
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: P@ssw0rd123
    volumes:
      - mongo-db:/data/db
volumes:
  mongo-db:
```

* Added persistant volume with name
```
col@ub22201:~/projects/study-docker-nodejs-loginAPI$ docker volume ls
DRIVER    VOLUME NAME
local     634a7d2664970f8ba6df075c2f9309ea74d2b474b4bf5251452e3fa013a5d03c
local     af622489a448bba34d1e483c9c1496eda884dc9be3a94b21a8611a58c0e156ed
local     study-docker-nodejs-loginapi_mongo-db

col@ub22201:~/projects/study-docker-nodejs-loginAPI$ docker images
REPOSITORY        TAG       IMAGE ID       CREATED         SIZE
nodejs-loginapi   latest    21666f297827   2 minutes ago   181MB
mongo             latest    a440572ac3c1   2 weeks ago     639MB

col@ub22201:~/projects/study-docker-nodejs-loginAPI$ docker ps -a
CONTAINER ID   IMAGE                    COMMAND                  CREATED              STATUS              PORTS                                       NAMES
d5c9ef60ff7c   mongo:latest             "docker-entrypoint.s…"   About a minute ago   Up About a minute   27017/tcp                                   mongodb
19bbe74b300d   nodejs-loginapi:latest   "docker-entrypoint.s…"   About a minute ago   Up About a minute   0.0.0.0:3001->3001/tcp, :::3001->3001/tcp   nodejs-loginapi
```

---

# PART3 - mongoes
* https://mongoosejs.com/docs/guide.html

```
npm install mongoose
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
docker logs xxxxx -f
docker network ls
docker network inspect xxxxx
```

docker-compose.dev.yml: Nodejs login add mongodb password
```yml
version: "3"
services:
  node-app:
    build:
      context: .
      args:
        NODE_ENV: development
    volumes:
      - ./:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - MONGO_USER=root
      - MONGO_PASSWORD=Passw0rd
    command: npm run dev
```


docker-compose.yml
```yml
    depends_on:
      - mongo
```

```
npm install mongoose
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build no-deps xxxxx
```

# PART3 - Demo BLOG API (CRUD Application)
* Get all posts
* Get a post
* Create a post
* Patch a post
* Delete a post

New folders and files
```

|--models
-----postModel.js
|--controllers
-----postController.js
|--routes
-----postRoutes.js

```

# PART4 - Demo Signup and Login

New folders and files
```

|--models
-----userModel.js
|--controllers
-----authController.js
|--routes
-----userRoutes.js

```

## bcryptjs
* https://www.npmjs.com/package/bcryptjs
```
npm install bcryptjs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

## auth - session with redis
* Two method for auth, 1) session, 2) redis
* https://hub.docker.com/_/redis
* https://www.npmjs.com/package/express-session
* https://www.npmjs.com/package/connect-redis

### add redis in docker compose

docker-compose.dev.yml: add redis
```yml
  redis:
    container_name: redis
    image: redis:latest
```

```sh
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
npm install redis connect-redis express-session
#-V renew volume, same with down and up again
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d -V 
```
docker-compose.dev.yml: add redis secret SESSION_SECRET
```yml
version: "3"
services:
  node-app:
    build:
      context: .
      args:
        NODE_ENV: development
    volumes:
      - ./:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - MONGO_USER=root
      - MONGO_PASSWORD=Passw0rd
      - SESSION_SECRET=secret
    command: npm run dev
```

index.js
```js
const { createClient } = require("redis")
let RedisStore = require("connect-redis")(session);
let redisClient = createClient({ 
  url: REDIS_URL + ":"+ REDIS_PORT,
  legacyMode: true 
})
redisClient.connect().catch(console.error)
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    cookie: {
      secure: false,
      resave: false,
      saveUninitialized: false,
      httpOnly: true,
      maxAge: 30000,
    },
  })
);
```

### Remarks
* redis3 vs redis4 connect method changed 
* https://devpress.csdn.net/cloudnative/63055fa5c67703293080f6be.html
```
app     | Error: connect ECONNREFUSED 127.0.0.1:6379
app     |     at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1187:16)
app     |   errno: -111,
app     |   code: 'ECONNREFUSED',
app     |   syscall: 'connect',
app     |   address: '127.0.0.1',
app     |   port: 6379
app     | }
```

```js
let redisClient = createClient({ 
  url: REDIS_URL + ":"+ REDIS_PORT,
  //url: 'redis://redis:6379'
  legacyMode: true 
})
```

```
docker exec -it redis redis-cli
127.0.0.1:6379> KEYS *
(empty array)

// after a user login
127.0.0.1:6379> KEYS *
1) "sess:2_Vlr1o-a75bAxP3vSbfzrPbfORXJeW1"
127.0.0.1:6379> GET "sess:2_Vlr1o-a75bAxP3vSbfzrPbfORXJeW1"
"{\"cookie\":{\"originalMaxAge\":30000,\"expires\":\"2023-02-20T10:16:22.951Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"}}"

// after a user signup
127.0.0.1:6379> KEYS *
1) "sess:hteGx9M6UfcBfuUiJU2Me6YkqSIyDgyn"
127.0.0.1:6379> GET "sess:hteGx9M6UfcBfuUiJU2Me6YkqSIyDgyn"
"{\"cookie\":{\"originalMaxAge\":300000,\"expires\":\"2023-02-20T10:27:20.159Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"user\":{\"username\":\"user2\",\"password\":\"$2a$12$Ek6S4ZG7Dyqry7qUb63.aenB6OyNSjm62nrJTsdYuqriTX4qGWwRK\",\"_id\":\"63f349dc46de15720f548e07\",\"__v\":0}}"
127.0.0.1:6379> 
```

## middleware - check if user had login

New folders and files
```
|--middleware
-----authMiddleware.js
```

authMiddleware.js
```js
const protect = (req, res, next) => {
    const { user } = req.session;
    if (!user) {
      return res.status(401).json({ 
            status: "fail", 
            message: "unauthorized" 
        });
    }
    req.user = user;
    next();
  };

  module.exports = protect;
```
---
# PART5 - nginx

* https://expressjs.com/en/guide/behind-proxies.html
* remove docker-compose files that port no need to expose from container but only nginx
* check below to see the load balance setting
```
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --scale node-loginapi=2

col@ub22201:~/projects/study-docker-nodejs-loginAPI$ docker ps -a
CONTAINER ID   IMAGE                  COMMAND                  CREATED         STATUS         PORTS                                   NAMES
7a18713d7917   nginx:stable-alpine    "/docker-entrypoint.…"   5 minutes ago   Up 5 minutes   0.0.0.0:3001->80/tcp, :::3001->80/tcp   study-docker-nodejs-loginapi_nginx_1
8390429a9ec7   node-loginapi:latest   "docker-entrypoint.s…"   5 minutes ago   Up 5 minutes   3001/tcp                                study-docker-nodejs-loginapi_node-loginapi_2
6e53df329ef8   node-loginapi:latest   "docker-entrypoint.s…"   5 minutes ago   Up 5 minutes   3001/tcp                                study-docker-nodejs-loginapi_node-loginapi_1
de397ec038ce   mongo:latest           "docker-entrypoint.s…"   5 minutes ago   Up 5 minutes   27017/tcp                               mongo
97f1e85cd47b   redis:latest           "docker-entrypoint.s…"   5 minutes ago   Up 5 minutes   6379/tcp                                redis

docker logs study-docker-nodejs-loginapi_node-loginapi_1 -f
docker logs study-docker-nodejs-loginapi_node-loginapi_2 -f

http://172.16.22.201:3001/api/v1
```

## cors
* https://expressjs.com/en/resources/middleware/cors.html

```
npm install cors
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build -V #build image on a running volume, use -V to use new volume
```

```js
const cors = require("cors");
app.use(cors({}))
```
---
# Part6 Deploy to production
## prod setup
/home/col
```sh

|--apps
-----loginapi
|--.env

```

```sh
col@ub22202:~$ ls -la
total 48
drwxr-x--- 6 col  col  4096 Feb 21 14:30 .
drwxr-xr-x 3 root root 4096 Jun  7  2022 ..
drwxrwxr-x 2 col  col  4096 Feb 21 14:30 apps
-rw------- 1 col  col  1150 Feb 21 13:08 .bash_history
-rw-r--r-- 1 col  col   220 Jan  6  2022 .bash_logout
-rw-r--r-- 1 col  col  3771 Jan  6  2022 .bashrc
drwx------ 2 col  col  4096 Jun  7  2022 .cache
-rw-rw-r-- 1 col  col   151 Feb 21 14:30 env
drwxrwxr-x 3 col  col  4096 Feb 21 12:41 .local
-rw-r--r-- 1 col  col   807 Jan  6  2022 .profile
drwx------ 2 col  col  4096 Jun  7  2022 .ssh
-rw-r--r-- 1 col  col     0 Jul 22  2022 .sudo_as_admin_successful
-rw------- 1 col  col   750 Feb 21 14:30 .viminfo
col@ub22202:~$ 
---
sudo nano .profile
set -o allexport; source /home/col/.env; set +o allexport;
---
exit
printenv
```

```
git clone https://github.com/kkyick2/study-docker-nodejs-loginAPI.git
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Deploy to production with hard way

* dev: push changes to git
* prod: git pull
* prod: docker-compose up build
* prod: build image
* prod: rebuild node container

dev environmrnt
```sh
git add --all
git commit -m "20230222 2005"
git push
```

prod environmrnt
```sh
# pull
git pull
# opt1 - build image, it build all projects (bad option)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
# opt2 - build the app only, but it build with deps (bad option)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build node-loginapi
# opt3 - build the app only, with no deps
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --no-deps node-loginapi
```

## Deploy to production with improved work flow
* https://hub.docker.com
* dev: build image on dev server
* dev: push built image to docker hub
* prod: docker hub pull image
* prod: docker-compose up
* prod: rebuild node container

### docker hub
* Create repository: kkyick2/node-loginapi

dev environmrnt
```sh
docker login
docker push
# need rename the image to <username>/<repository>
docker image tag <old_name> kkyick2/node-loginapi
docker push kkyick2/node-loginapi
```