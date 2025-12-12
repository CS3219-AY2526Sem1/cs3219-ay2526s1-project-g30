[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/QUdQy4ix)
# CS3219 Project (PeerPrep) - AY2526S1
## Group: G30

### Note: 
- You are required to develop individual microservices within separate folders within this repository.
- The teaching team should be given access to the repositories as we may require viewing the history of the repository in case of any disputes or disagreements. 

## Table of Contents
1. [Product Overview](#product-overview)
2. [Project Architecture](#project-architecture)
3. [Pre-requisites](#pre-requisites)
4. [How to Deploy PeerPrep locally](#how-to-deploy-peerprep-locally)
4. [AI Usage Documentation](#ai-usage-documentation)

## Product Overview<a id='product-overview'></a>
PeerPrep is an online learning platform designed to help new coders grow through collaboration and peer learning. It provides an interactive environment where users can connect with others of similar skill levels and practice solving common coding interview questions together in real time. PeerPrep promotes learning helping beginners strengthen their coding skills, build confidence, and prepare more effectively for technical interviews.

## Project Architecture<a id='project-architecture'></a>
<img width="1355" height="876" alt="image" src="https://github.com/user-attachments/assets/6f59290a-fbd1-403c-a205-2695c7a8d734" />

### System Architecture
| Service | Language | Framework | Database | Tools |
|---------|----------|-----------|----------|-------|
| User Service | Javascript | Node.js (Backend)<br>Express.js (API)<br>Mongoose | MongoDB Atlas  | SendGrid (Email verification) <br>Bcryptjs (Password Hashing)<br>Jsonwebtoken (For Authentication)<br>Google Cloud Storage (For profile pictures storage)|
| Question Service | JavaScript | Node.js (Backend)<br>Express.js (API)<br>Mongoose | MongoDB Atlas | N/A |
| Collaboration Service | JavaScript | Node.js (Backend)<br>HTTP Server<br>WebSocket Server | MongoDB Atlas | YJS |
| Matching Service | Go | Gin | N/A | Podman (Containerization test)<br>cURL&xh (API test) |
| UI Service (Frontend) | TypeScript<br>TypeScript XML<br>CSS | React (View layer, server/client components, server actions, virtual DOM, state/props management, React Compiler)<br>NextJS (Partial prerendering, routing, middleware, optimisations, improved DX)<br>Tailwind CSS (Styling)<br>NodeJS (Backend)<br>Vitest (Testing) | N/A | dnd-kit (Drag-and-drop interaction library)<br>Motion (Animations)<br>Zod (Validation)<br>Monaco (Editor UI)<br>Lucide Icons (Icons)<br>shadcn/ui + Radix UI (UI component libraries)<br>YJS (CRDTs)<br>Turbopack (JS/TS bundling + optimization) |
| Project-Wide (DevOps) | YAML<br>JSON | N/A | N/A | Google Cloud Platform (Cloud Run, Cloud Build, Artifact Registry, Secret Manager)<br>Docker, Docker Compose, Git & GitHub, Postman |

## Pre-requisites<a id='pre-requisites'></a>
| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | LTS | For all JavaScript based services |
| npm | latest | Dependency management |
| Go | latest | For matching-service |
| Docker | latest | Running containers |

## .env Setup
Each microservice uses its own configured environment variables. To run the services locally, you will need to create the following .env files and supply the your own values.

Note that the user, question and collab services each use their own MongoDB database. We do not provide locally hosted MongoDB databases in this repo.

If running locally, use `http://localhost:<insert PORT>` for each microservice. The default port for each microservice is as follows:
| Service | Port |
|---------|------|
| User | 5001 |
| Matching | 8080 |
| Question | 4000 |
| Collab | 1234 |
| UI | 3000 |

### /user-service/.env
```
MONGO_URI=<insert database URL>
PORT=5001
JWT_SECRET=your_super_secret_random_string_that_is_long_and_unguessable
SENDGRID_API_KEY=<insert SendGrid API key>
GCS_BUCKET_NAME=peerprep-user-service
```

### /matching-service/.env
```
COLLAB_SERVICE_URL: "<insert URL>"
QUESTION_SERVICE_URL: "<insert URL>"
```

### /question-service/.env
```
MONGO_URI=<insert database URL>
USER_SERVICE_URL=<insert URL>
```

### /collab-service/collab-server/.env
```
MONGO_DB_URL = <insert URL>
SESSION_TIMEOUT = 3600000
SESSION_UPDATE = 5000
USER_SERVICE = <insert URL>
QUESTION_SERVICE = <insert URL>
```

### /ui-service/
```
NODE_ENV=development
SESSION_SECRET=<secret key here>
JWT_SECRET=<secret key here>
SESSION_EXPIRES_IN_DAYS=7
NEXT_PUBLIC_USER_SERVICE_URL=<url here>
NEXT_PUBLIC_MATCHING_SERVICE_URL=<url here>
NEXT_PUBLIC_QUESTION_SERVICE_URL=<url here>
NEXT_PUBLIC_COLLAB_SERVICE_URL=<url here>
NEXT_PUBLIC_COLLAB_SERVICE_WS_URL=<websocket url here>
USER_SERVICE_TIMEOUT=10000
```
If running locally, `NEXT_PUBLIC_COLLAB_SERVICE_WS_URL` should be `ws://localhost:1234`.

## How to Deploy PeerPrep locally<a id='how-to-deploy-peerprep-locally'></a>

You will have to run **each microservice in a separate terminal**. Ensure that Docker is running, then from the project root folder, navigate to each service's Dockerfile, build the image and run it.

The instructions below assume you always begin from the project root folder.

### User Service
```
cd user-service
docker build -t user-service .
docker run --env-file .env user-service
```

### Matching Service
```
cd matching-service
docker build -t matching-service .
docker run --env-file .env matching-service
```

### Question Service
```
cd question-service
docker build -t question-service .
docker run --env-file .env question-service
```

### Collab Service
```
cd collab-service/collab-server
docker build -t collab-service .
docker run --env-file .env collab-service
```

### UI Service
```
cd ui-service
docker build -t ui-service .
docker run --env-file .env ui-service
```


## AI Usage Documentation<a id='ai-usage-documentation'></a>
AI Use Summary
Prohibited phases avoided: requirements elicitation; architecture/design decisions.
Allowed uses:
- Generating boilerplate and implementation code
- Refactoring codebase
- Debugging code and deployment

Verification: All AI outputs reviewed, edited, and tested by the authors.

Refer to the [`ai/`](./ai/) folder for records of how AI was used in the development of PeerPrep for the different services.
