#!/bin/bash
# dump_db.sh
# Script to dump the local PostgreSQL database to a SQL file for Cloud SQL import.

# Set the database URL from your .env file
DB_URL="postgresql://postgres:postgres@localhost:5432/erp_db"
OUTPUT_FILE="cloud_sql_import.sql"

echo "Dumping database..."
echo "Source: localhost:5432/erp_db"
echo "Output: $OUTPUT_FILE"

# pg_dump arguments explained:
# --format=plain: Plain text SQL file (standard for Cloud SQL imports)
# --clean: Include DROP statements before creating tables
# --if-exists: Prevents errors if tables don't exist during the drop phase
# --no-owner: Don't set ownership (Cloud SQL user might be different)
# --no-privileges: Don't export local privileges

pg_dump "$DB_URL" \
  --format=plain \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --file="$OUTPUT_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Database dump complete! "
  echo "You can now upload '$OUTPUT_FILE' to a Google Cloud Storage bucket and import it into your Cloud SQL instance."
else
  echo "❌ Error: Database dump failed. Make sure your local PostgreSQL server is running and you have pg_dump installed."
fi
