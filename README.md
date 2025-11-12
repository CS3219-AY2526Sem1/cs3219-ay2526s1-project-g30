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

## How to Deploy PeerPrep locally<a id='how-to-deploy-peerprep-locally'></a>



## AI Usage Documentation<a id='ai-usage-documentation'></a>
Refer to  [`ai/`](./ai/) for a record of how AI was used in the development of PeerPrep for the different services.
