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
mongosh -u "root" -p "P@ssw0rd123"
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

index.js
```js
const session = require("express-session");
const redis = require("redis");
let RedisStore = require("connect-redis")(session);

//...etc

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

```sh
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

```
docker exec -it redis redis-cli
KEYS *
```