# Local Docker Environment

This compose setup starts local PostgreSQL, Liquibase, and GMDB API containers for UI development.

## Usage

1. Copy `.env.example` to `.env`.
2. Fill in the local path and password values.
3. Start the services:

```sh
docker/gmdb-services/start.sh
```

4. Stop the services:

```sh
docker/gmdb-services/stop.sh
```

The scripts are thin wrappers around:

```sh
docker compose --env-file docker/gmdb-services/.env -f docker/gmdb-services/compose.yml
```

The services start in this order:

1. `postgres`
2. `liquibase-bootstrap`
3. `liquibase-migrate`
4. `api`

The Liquibase services are one-shot jobs. The API is exposed on `localhost:8080`. PostgreSQL listens on standard port `5432` inside the compose network and is published to `POSTGRES_PORT`, which defaults to `5432`. Application code should continue using relative API URLs through the UI dev server proxy.
