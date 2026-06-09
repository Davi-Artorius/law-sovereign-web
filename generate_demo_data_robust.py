#!/usr/bin/env python3

import requests
import random
import time
from datetime import datetime

API_URL = "http://localhost:4000"
TOKEN = "***REMOVED***"

NOMES = [
    "Dr. João Silva", "Dra. Maria Santos", "Dr. Pedro Oliveira", "Dra. Ana Costa",
    "Dr. Carlos Mendes", "Dra. Paula Ferreira", "Dr. Bruno Rocha", "Dra. Fernanda Lima",
    "Dr. Ricardo Alves", "Dra. Beatriz Martins", "Dr. Felipe Sousa", "Dra. Camila Neves",
    "Dr. Gustavo Barbosa", "Dra. Larissa Teixeira", "Dr. Marcelo Gomes", "Dra. Vanessa Cruz",
]

AREAS = ["Civil", "Trabalhista", "Criminal", "Comercial", "Tributário", "Imobiliário"]

CASOS = [
    "Ação de indenização por danos morais",
    "Cobrança de débito comercial",
    "Disputa de inventário e herança",
    "Rescisão de contrato de aluguel",
    "Reconhecimento de paternidade",
    "Processo tributário em apelação",
]

STATUSES = ["TRIAGEM", "PROPOSTA", "CONTRATO", "ATIVO", "DESFECHO"]

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TOKEN}"
}

def create_client(payload, retry_count=3):
    for attempt in range(retry_count):
        try:
            response = requests.post(f"{API_URL}/clients", json=payload, headers=headers, timeout=10)
            if response.status_code == 201:
                return True
            elif attempt < retry_count - 1:
                time.sleep(1)
        except Exception:
            if attempt < retry_count - 1:
                time.sleep(2)
    return False

print("🚀 Gerando 120 leads para propaganda (com delay)...\n")

created = 0
for i in range(120):
    status = STATUSES[i % len(STATUSES)]

    payload = {
        "name": random.choice(NOMES),
        "area": random.choice(AREAS),
        "case": random.choice(CASOS),
        "status": status,
        "phone": f"61 9{random.randint(20000000, 99999999)}",
        "lastAction": "Contato realizado",
        "chanceOfSuccess": random.randint(30, 95),
        "costOfWaiting": random.randint(5000, 50000),
        "isPaperLead": random.choice([True, False])
    }

    if create_client(payload):
        created += 1
        print(f"✓ [{created:3d}/120] {payload['name']} — {status}")
    else:
        print(f"✗ Falha: {payload['name']}")

    # Delay para não sobrecarregar
    time.sleep(0.3)

print(f"\n✅ {created}/120 leads criados com sucesso!")
