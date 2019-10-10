# Container image that runs your code
FROM node:10-alpine

# Copies your code file from your action repository to the filesystem path `/` of the container
COPY package.json yarn.lock
COPY ./ /
RUN yarn --pure-lockfile

# Code file to execute when the docker container starts up (`entrypoint.sh`)
ENTRYPOINT ["ls"]
