FROM node:20-slim

WORKDIR /usr/src/app

RUN apt-get update && apt-get -qq install -y --no-install-recommends \
    tzdata \
    tini \
    && rm -rf /var/lib/apt/lists/*

COPY --chown=node:node package*.json ./

RUN npm ci

COPY --chown=node:node . .

RUN npm run build

USER node

ENTRYPOINT ["/usr/bin/tini", "--"]

CMD ["node", "dist/main.js"]
