import os
import sqlite3
from typing import List


DB_CANDIDATES: List[str] = [
    os.path.join('instance', 'smartinv_dev.db'),
    os.path.join('instance', 'smartinv.db'),
    'smartinv_dev.db',
    'smartinv.db',
]


def ensure_selected_line_items(db_path: str) -> None:
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.cursor()
        cur.execute('PRAGMA table_info(invoices)')
        cols = [r[1] for r in cur.fetchall()]
        print(f"DB {db_path} columns: {cols}")
        if 'selected_line_items' not in cols:
            print(f"Adding selected_line_items to {db_path}")
            cur.execute('ALTER TABLE invoices ADD COLUMN selected_line_items TEXT')
            conn.commit()
            print(f"Added selected_line_items to {db_path}")
        else:
            print(f"selected_line_items already exists in {db_path}")
    finally:
        conn.close()


def main():
    any_found = False
    for p in DB_CANDIDATES:
        if os.path.exists(p):
            any_found = True
            try:
                ensure_selected_line_items(p)
            except Exception as e:
                print(f"Failed to update {p}: {e}")
    if not any_found:
        print('No candidate SQLite DB files found.')


if __name__ == '__main__':
    main()


