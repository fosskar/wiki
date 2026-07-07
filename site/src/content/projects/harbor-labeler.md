---
title: harbor-labeler
description: kubernetes cronjob that labels running container images in harbor
repo: https://github.com/fosskar/harbor-labeler
tags: [kubernetes, harbor, containers]
order: 3
---

Scans the cluster for images that are actually running and labels them in the
Harbor registry, so retention policies can distinguish in-use images from
garbage-collectable ones.
