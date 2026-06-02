#!/usr/bin/env python3
"""Run Supabase migration SQL files via the Management API.

Usage: python3 scripts/supabase-migrate.py supabase/migrations/007_project_photos.sql

Requires SUPABASE_MANAGEMENT_TOKEN (sbp_...) in .env.local.
"""
import os
import sys
import json
import urllib.request
from urllib.error import HTTPError
import ssl

PROJECT_REF = "kotuuuwhmbhrmcofdifd"

def load_env():
    env = {}
    env_path = os.path.expanduser("~/workspace/craftly/.env.local")
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k] = v
    return env

def run_sql(token, sql):
    """Execute SQL via Supabase Management API."""
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
    data = json.dumps({"query": sql}).encode()
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "Craftly-Migrator/1.0",
    }, method="POST")
    
    ctx = ssl.create_default_context()
    try:
        resp = urllib.request.urlopen(req, context=ctx)
        return json.loads(resp.read())
    except HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"SQL failed (HTTP {e.code}): {body}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/supabase-migrate.py <migration.sql>")
        sys.exit(1)
    
    migration_path = sys.argv[1]
    if not os.path.exists(migration_path):
        print(f"File not found: {migration_path}")
        sys.exit(1)
    
    env = load_env()
    token = env.get("SUPABASE_MANAGEMENT_TOKEN", "")
    if not token or not token.startswith("sbp_"):
        print("ERROR: Need a personal access token (sbp_...) in .env.local")
        print("Get one at: https://supabase.com/dashboard/account/tokens")
        sys.exit(1)
    
    with open(migration_path) as f:
        sql = f.read()
    
    print(f"Running migration: {migration_path}")
    print(f"SQL length: {len(sql)} chars")
    print(f"Project: {PROJECT_REF}")
    print("-" * 40)
    
    try:
        result = run_sql(token, sql)
        print("SUCCESS")
        if result:
            print(f"Result: {json.dumps(result, indent=2)[:500]}")
    except RuntimeError as e:
        print(f"FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
