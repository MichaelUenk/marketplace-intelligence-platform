We need data from apollo, we need data we crawl additionally,
and we need to cache this data to reuse this data / apply ETL tools if / when those get updated.
That's basically injestion + datalate - can store it in S3 or whatever self-hosted version like MinIO

Should:

- Store data in partitions by source (e.g., /apollo/raw/, /firecrawl/enriched/) and timestamp for easy caching and auditing.
- Include metadata (e.g., JSON sidecars) for provenance, like "source: apollo.ai, fetched: 2025-10-15".

This should be fairly cheap, unless data grows to petabytes - then we can move self-hosted. Thede days you can have betabyte in rack.
Of course storage back-end should be configurable.

For the "gold" data I was originally thinking good old tables and joins,
but given that we want to be at minimum easy to reconfigure per project, at max fully dynamic and AI-driven -
knowledge graph would be a better fit.

To store the knowledge graph plan A would be neo4j - mature ecosystem, good docs. No sharding but there are some ways to scale with "fabric"
Single large memory server would be enough for most cases tho.
But I'm also looking at possible modern out-of-the-box scalable alternatives like NebulaGraph.

We could try hybrid approach like tables + graph as sort of back-up / better perforamnce / see what sticks,
but that would be longer to develop. Let's start with graph. At least it is infitely better than spreadsheets :D

ETL tools triggered when new files appear, parse and add links to the graph.
First hard-coded ETL tools, then adding specialized agent-based tool for "non-standard cases".

The key is to separate all these steps as indepenent services. Likewise the  codebases - be it different folder in the monorepo, different sub-repo etc.

I know that you guys want everything yesteray - but this is critical part. The more you keep bulding on not well suited archhitecute -
the more cost of error will be. If you can run with current setup for a bit longer - I suggest building simple prototype with graph approach:

For starters hand-triggered from bottom to the top, that is not by the agent but manually triggering ingestion - manually triggering enrichment etc.

Simple ingestors: one for appolo, let's say just get companies / people. One for foirecraw for say events.
then start ETL - parse new files, add links to the graph.
on top for now - manual forkflows like you have in n8n, can even keep them at n8n, just be quering graph vs your spreadsheets.
We write tools for doing it easy wasy: a set of "standard" ones to not ask agent (when it comes to that) to write graph queries every time,
say "get entities", basic join-like functionality, and specialized agent for writing / retrying qraph queries for non-standard cases.

For "agent works in background and gives you new leads" - graph works well.
For data marts like that map - we would have own cache layer to not read graph database every time.

As for the current codabase. Definitely need dissagragation of all stages.
Writing stand-alone ingestors like from appolo to S3 is easier from sratch, looking at current code for reference.
Nice maps and hight level features - we take them as they are and change to work on top of new data layer.
