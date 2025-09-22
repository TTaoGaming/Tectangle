# ADR | 2025-09-21T00:00:00Z | ww-2025-121

Context: Need to work from anywhere and run agent swarms in the cloud, while preventing personal info from leaking. Current repo mixes code, Webways, and personal notes.

Decision: Adopt "Private GitHub + Sanitized Public Mirror". Push full repo to a private GitHub repository. Add a sanitize:ci pipeline that blocks publishing on PII/path violations. When green and behind FEATURE_PUBLISH_SANITIZED_MIRROR, publish a filtered mirror to a separate public repo. Add Discord/Slack orchestrator later.

Consequences: Two repos to track (private source of truth, public mirror artifact). Extra CI steps for sanitize and mirror. Strong privacy posture with reversible publishing. Enables collaboration and chat-driven workflows without sharing sensitive content.

Links: [Webway note](../../../../scaffolds/webway_cloud-swarm-git-sanitize.md)
