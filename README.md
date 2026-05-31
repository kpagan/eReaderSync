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
