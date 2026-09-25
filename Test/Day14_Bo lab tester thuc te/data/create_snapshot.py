"""Rebuild only the Day14 SQLite exercise snapshot; never connects to MongoDB."""
import sqlite3
from pathlib import Path
import argparse

def create_snapshot(clean=False):
    target=Path(__file__).resolve().parent/'day14_snapshot.sqlite'
    with sqlite3.connect(target) as db:
        db.executescript('DROP TABLE IF EXISTS attempts; DROP TABLE IF EXISTS users; CREATE TABLE users(id TEXT PRIMARY KEY,email TEXT,role TEXT); CREATE TABLE attempts(id TEXT PRIMARY KEY,userId TEXT,score REAL,maxScore REAL);')
        db.executemany('INSERT INTO users VALUES(?,?,?)', [('u1','student1@day14.test','STUDENT'),('u2','student2@day14.test' if clean else ' STUDENT1@day14.test ','STUDENT')])
        db.executemany('INSERT INTO attempts VALUES(?,?,?,?)',[('a1','u1',10,20),('a2','u2' if clean else 'missing-user',0,20)])
    return target

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--clean',action='store_true'); args=parser.parse_args()
    print(create_snapshot(args.clean))
