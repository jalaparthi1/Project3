#!/bin/bash

echo "Christmas Fifteen Puzzle - Database Setup"
echo "=========================================="
echo ""
echo "This script will set up the MySQL database using command line."
echo "Make sure MySQL is installed and running."
echo ""

read -p "Enter MySQL username (default: root): " DB_USER
DB_USER=${DB_USER:-root}

echo ""
echo "Connecting to MySQL..."
echo ""

mysql -u "$DB_USER" -p < schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "Database setup completed successfully!"
    echo "Database 'christmas_puzzle' has been created with all tables."
else
    echo ""
    echo "Error: Database setup failed."
    echo "Please check your MySQL credentials and try again."
fi

