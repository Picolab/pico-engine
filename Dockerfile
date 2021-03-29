#
# This Dockerfile creates a docker image for the pico engine with an external mount point for the image
#
# To build:
#    docker build -t <usename>/<container-name> .
#
# For example:
#    docker build -t pjw/pico-engine .
#
# The build runs 'clean-setup' to ensure the image is clean.
# The build is done with the files in the pico-engine directory, so be sure it's up to date. 
#
# To run:
#    docker run -p <port>:3000  -v <mount-point>:/var/pico-engine -d <username>/container-name>
#
# For example:
#    docker run -p 3001:3000  -v ~/tmp/pico-image:/var/pico-engine -d pjw/pico-engine
#
# runs the docker with a port of 3001 and the image files located at ~/tmp/pico-image on the local machine.
#
# You can run the same container multiple times with different ports and mount points to have multiple engines
# running at the same time. 

FROM node:14

# Create app directory
WORKDIR /usr/src/app
VOLUME ["/var/pico-engine"]
ENV PICO_ENGINE_HOME=/var/pico-engine

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3000
RUN npm run clean-setup
CMD [ "npm", "start" ]