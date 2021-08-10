#
# This Dockerfile creates a docker image for the pico engine with an external mount point for the image
#
# To build:
#    docker build -t <username>/<container-name> github.com/picolab/pico-engine
#
# For example:
#    docker build -t pjw/pico-engine github.com/picolab/pico-engine
#
# To run:
#    docker run -p <port>:3000  -v <mount-point>:/var/pico-image -d <username>/container-name>
#
# For example:
#    docker run -p 3001:3000  -v ~/images/pico-image:/var/pico-image -d pjw/pico-engine
#
# runs the docker with a port of 3001 and the image files located at ~/tmp/pico-image on the local machine.
#
# If you need to set the URL for your engine, you can add the PICO_ENGINE_BASE_URL env variable:
#
#    docker run -p 443:3000  -v ~/images/pico-image:/var/pico-image -d pjw/pico-engine -e PICO_ENGINE_BASE_URL=https://picos.picolabs.io
#
# You can run the same container multiple times with different ports and mount points to have multiple engines
# running at the same time.
#

FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

# Create mount point for image
VOLUME ["/var/pico-image"]
ENV PICO_ENGINE_HOME=/var/pico-image

# install the production pico-engine 
RUN npm install -g pico-engine

# run it on port 3000 (default)
EXPOSE 3000
CMD ["pico-engine"]

# This might be useful for creating a docker image of the dev env (includes parser, etc.)
# # Install app dependencies
# # A wildcard is used to ensure both package.json AND package-lock.json are copied
# # where available (npm@5+)
# COPY package*.json ./

# RUN npm install

# # Bundle app source
# COPY . .

# EXPOSE 3000
# RUN npm run clean-setup
# CMD [ "npm", "start" ]
