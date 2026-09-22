# BrightBuy

## Project Structure

```text
BrightBuy/
├── database/
│   ├── 01_schema.sql             # Task 1: Tables, PKs, FKs, and CHECK constraints
│   ├── 02_seeds.sql              # Task 2: Categories, products, variants, and cities
│   ├── 03_functions_triggers.sql # Task 3: Delivery calculation & stock triggers
│   ├── 04_procedures.sql         # Task 4: sp_PlaceOrder atomic checkout logic
│   └── 05_reports_indexes.sql    # Task 5: Reporting queries & performance indexes
│
├── docker-compose.yml            # MySQL 8.0 container definition
├── .gitignore
└── README.md
```

## Requirements

* Docker
* Docker Compose

## Start the MySQL Container

From the root directory of the project, run:

```bash
docker compose up -d
```

This starts the BrightBuy MySQL container in detached mode.

## Login to MySQL

Use the following command to access the MySQL server inside the Docker container:

```bash
docker exec -it brightbuy-mysql mysql -u root -proot
```

> **Note:** There is no space between `-p` and the password.
> `-proot` means the MySQL root password is `root`.

## Stop the Container

To stop the container without removing its data:

```bash
docker compose down
```

## Reset the Database

If changes have been made to the database schema or seed data and you want to completely reset the database, run:

```bash
docker compose down -v
```

The `-v` option removes the Docker volumes, which deletes the persisted MySQL data.

After resetting, start the container again:

```bash
docker compose up -d
```

## Database Tasks

The SQL files are organized according to the project tasks:

### Task 1 — Database Schema

`database/01_schema.sql`

Contains:

* Database tables
* Primary keys (PKs)
* Foreign keys (FKs)
* `CHECK` constraints

### Task 2 — Seed Data

`database/02_seeds.sql`

Contains initial data for:

* Categories
* Products
* Product variants
* Cities

### Task 3 — Functions & Triggers

`database/03_functions_triggers.sql`

Contains:

* Delivery calculation functions
* Stock management triggers

### Task 4 — Stored Procedures

`database/04_procedures.sql`

Contains:

* `sp_PlaceOrder`
* Atomic checkout/order placement logic

### Task 5 — Reports & Indexes

`database/05_reports_indexes.sql`

Contains:

* Reporting queries
* Performance-related indexes

## Useful Docker Commands

### Check Running Containers

```bash
docker ps
```

### View MySQL Container Logs

```bash
docker logs brightbuy-mysql
```

### Follow MySQL Logs

```bash
docker logs -f brightbuy-mysql
```

### Stop the Project

```bash
docker compose down
```

### Stop and Delete Database Data

```bash
docker compose down -v
```
