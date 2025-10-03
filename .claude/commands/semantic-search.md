---
description: Perform semantic search in Obsidian vault using Smart Connections via Local REST API
allowed-tools:
  - Bash(curl:*)
---

## Context

- **Search Query:** `$ARGUMENTS`
- **API Configuration:** Local REST API running on https://127.0.0.1:27124/
- **Smart Connections Endpoint:** `/search/smart`

## Your task

Execute a semantic search in the Obsidian vault using the Smart Connections plugin via curl.

Run this single command to perform the search:

```bash
curl -k -X POST \
  https://127.0.0.1:27124/search/smart \
  -H "Authorization: Bearer $(grep LOCAL_REST_API_KEY .env | cut -d'=' -f2)" \
  -H "Content-Type: text/plain" \
  -d "{\"query\": \"$ARGUMENTS\", \"filter\": {\"limit\": 5}}" | jq .
```
