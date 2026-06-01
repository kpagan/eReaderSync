# eReaderSync

## Description
This application is designed primarily to send ebooks to an eReader device like e.g. Kindle or Kobo.

## Install
To install the application's dependencies run
`npm install`

## Run the application
In a terminal run `npm start` to start the server.

Then, open a browser to the url http://localhost:3000/ to view the page.

## Docker
Build the Docker image with:

```bash
docker build -t ereadersync:latest .
```
### Or for multiplatform build:

Build with cloud builder:

**Prerequisites**: You've signed up for [Docker Build Cloud and created a builder](https://docs.docker.com/build-cloud/setup/)

Connect builder to Docker Desktop:

`docker buildx create --driver cloud <builder-name>`

Build the image for linux/amd64 and linux/arm64 using Docker Build Cloud:
```bash
docker build \
   --builder cloud-builder-name \
   --platform linux/amd64,linux/arm64 \
   -t ereadersync:latest \
   --output ./bin .
```
This command builds the image using the cloud builder and exports the binaries to the bin directory.

If an error `A required privilege is not held by the client.` appears the run the command from command prompt with Administrator privileges.

Verify that the binaries are built for both platforms. You should see the nvim binary for both linux/amd64 and linux/arm64.

```bash
 $tree ./bin
./bin
├── linux_amd64
│   ├── app
│   └── ...
└── linux_arm64
    ├── app
    └── ...
X directories, Y files
```

To export the image to load to another device/platform run:
```bash
docker save --output ereadersync.tar --platform linux/arm64 ereadersync
```
Then copy the tar to the other device and load it:
```bash
 docker load --input ereadersync.tar
 ```

Run the container with the local `uploads` folder mounted as a volume:

```bash
docker run -p 3000:3000 -v "$PWD/uploads":/app/uploads ereadersync:latest
```

Open `http://localhost:3000/` in your browser.

## Docker Compose
Use Docker Compose to build and run the app with the `uploads` folder mounted:

```bash
export UPLOADS_BASE_PATH=/tmp && docker compose up
```

Then visit `http://localhost:3000/`.

## Transfer the Docker image to another machine

See https://www.baeldung.com/ops/share-image-without-docker-hub
