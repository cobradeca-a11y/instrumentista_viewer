#!/usr/bin/env python3
"""
upload_scores.py — Faz upload dos JSONs de louvores para o Supabase Storage.

Uso:
  1. pip install supabase
  2. Defina a variável SUPABASE_SERVICE_KEY com a service_role key do projeto
  3. python upload_scores.py

A service_role key está em:
  Supabase Dashboard → instrumentistas → Settings → API → service_role
"""

import json
import os
import sys
from pathlib import Path

SUPABASE_URL = "https://ehjnepbxelqyqspgdwii.supabase.co"
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
BUCKET = "scores"

# Arquivos a enviar: (arquivo_local, nome_no_storage)
SCORES = [
    ("ainda-uma-vez_viewer.json",   "ainda-uma-vez.json"),
    ("cordeiro-eterno_viewer.json", "cordeiro-eterno.json"),
]


def upload():
    if not SUPABASE_SERVICE_KEY:
        print("ERRO: defina a variável SUPABASE_SERVICE_KEY")
        print("  export SUPABASE_SERVICE_KEY='sua_service_role_key'")
        sys.exit(1)

    try:
        from supabase import create_client
    except ImportError:
        print("ERRO: instale o cliente Supabase:")
        print("  pip install supabase")
        sys.exit(1)

    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    for local_file, storage_name in SCORES:
        path = Path(local_file)
        if not path.exists():
            print(f"  ✗ Arquivo não encontrado: {local_file}")
            continue

        data = path.read_bytes()
        print(f"  → Enviando {storage_name} ({len(data):,} bytes)...")

        try:
            client.storage.from_(BUCKET).upload(
                path=storage_name,
                file=data,
                file_options={"content-type": "application/json", "upsert": "true"},
            )
            print(f"  ✓ {storage_name} enviado com sucesso")
        except Exception as e:
            print(f"  ✗ Erro ao enviar {storage_name}: {e}")

    print("\nURL pública dos arquivos:")
    for _, storage_name in SCORES:
        print(f"  {SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{storage_name}")


if __name__ == "__main__":
    upload()
