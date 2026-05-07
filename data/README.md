# data/

This directory holds the raw DVLA **VEH0120** CSV that both demos consume. The
file is **user-supplied** and is **never committed** — `.gitignore` excludes
`*.csv`, `*.parquet`, and `*.tsv` here.

## What to place here

Download DVLA dataset **VEH0120** ("Vehicles registered for the first time by
make and model") from gov.uk and save it as:

```
data/veh0120.csv
```

The exact filename is referenced by the ETL in
[src/etl/](../src/etl/) and is fixed by Feature 001's spec.

## Why this is gitignored

- The dataset is large.
- It is freely available from the original source, so committing it adds noise
  without adding value.
- A clone of this repository should run `docker compose up -d` and the ETL
  against a CSV the contributor downloads themselves.
