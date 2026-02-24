@echo off
echo Dropping existing database...
dropdb -U postgres scanlyv11

echo Creating new database...
createdb -U postgres scanlyv11

echo Creating extensions...
psql -U postgres -d scanlyv11 -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql -U postgres -d scanlyv11 -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"

echo Running Prisma migrations...
npx prisma migrate reset --force

echo Done!