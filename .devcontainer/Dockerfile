FROM node:22-slim

WORKDIR /workspace

# Install git (for tooling that expects it)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY HiveFleetObsidian ./HiveFleetObsidian
COPY tests ./tests

CMD ["bash"]

