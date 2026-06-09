#!/usr/bin/env python3

import requests
import random
from datetime import datetime, timedelta

API_URL = "http://localhost:4000"
TOKEN = "***REMOVED***"

NOMES = [
    "Dr. João Silva", "Dra. Maria Santos", "Dr. Pedro Oliveira", "Dra. Ana Costa",
    "Dr. Carlos Mendes", "Dra. Paula Ferreira", "Dr. Bruno Rocha", "Dra. Fernanda Lima",
    "Dr. Ricardo Alves", "Dra. Beatriz Martins", "Dr. Felipe Sousa", "Dra. Camila Neves",
    "Dr. Gustavo Barbosa", "Dra. Larissa Teixeira", "Dr. Marcelo Gomes", "Dra. Vanessa Cruz",
]

AREAS = ["Civil", "Trabalhista", "Criminal", "Comercial", "Tributário", "Imobiliário", "Previdenciário", "Ambiental"]

CASOS = [
    "Ação de indenização por danos morais",
    "Cobrança de débito comercial",
    "Disputa de inventário e herança",
    "Rescisão de contrato de aluguel",
    "Ação trabalhista por assédio",
    "Reconhecimento de paternidade",
    "Processo tributário em apelação",
    "Cumprimento de sentença",
    "Divórcio litigioso com custódia",
]

STATUSES = ["TRIAGEM", "PROPOSTA", "CONTRATO", "ATIVO", "DESFECHO"]

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TOKEN}"
}

print("🚀 Gerando 120 leads para propaganda...\n")

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

    try:
        response = requests.post(f"{API_URL}/clients", json=payload, headers=headers, timeout=5)
        if response.status_code == 201:
            created += 1
            print(f"✓ [{created:3d}/120] {payload['name']} — {status}")
        else:
            print(f"✗ Erro: {response.text[:50]}")
    except Exception as e:
        print(f"✗ Erro de conexão: {str(e)[:50]}")

print(f"\n✅ {created} leads criados com sucesso!")
