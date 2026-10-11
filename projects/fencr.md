---
title: fencr
description: sealed firecracker microvm sandboxes for ai agents on nixos
repo: https://github.com/fosskar/fencr
tags: [nixos, microvm, firecracker, agents, security]
order: 2
---

A NixOS module that runs an agent in its own Firecracker microVM and keeps
everything sensitive on the host. Outbound traffic goes only where it is
granted, API keys never enter the guest (the host injects them into permitted
requests only), and MCP tool calls pass a gateway that allows each sandbox only
its granted tools. fencr ships no agent: you declare what runs inside, fencr
builds the sandbox and the boundary around it.
