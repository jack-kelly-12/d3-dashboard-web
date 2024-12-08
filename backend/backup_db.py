import sqlite3
import os


def backup_database():
    with open('database_backup.sql', 'w') as f:
        conn = sqlite3.connect('ncaa.db')
        for line in conn.iterdump():
            f.write(f'{line}\n')
        conn.close()


if __name__ == "__main__":
    backup_database()
