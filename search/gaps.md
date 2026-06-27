# search/gaps.md — Delta between attested record and target role

**Attested by:** Mercury (Zhenhao Ma) · 2026-06-26
**Target role (from `profile.yml`):** Cloud / Platform / DevOps engineer at a public, sponsorship-friendly enterprise-software company (SAP, Google, Microsoft, Amazon tier).
**Source of "have":** `search/resume.json` (attested) — SAP S/4HANA LCM intern, Eth Tech full-stack + DevOps, PaddleOCR ROCm hackathon (in-progress).

The evidence column is the discipline. Every row cites something checkable — an
O*NET skill row for the SOC code, or a pattern observed across at least three
recent postings in the target sector. A gap with no evidence is a feeling, not a
finding; feelings live in `private-notes.md`, not here.

A gap closes only when a shipped artifact exists that a third party could verify
— a merged PR, a published benchmark, a credential with an external issuer.
When that happens, the row leaves this file and a new entry appears in
`resume.json`. **gaps.md is a place things leave.**

## Active gaps

| # | Gap | Evidence the target demands it | What I have | Plan to close it |
|---|-----|--------------------------------|-------------|------------------|
| 1 | **Production Kubernetes / container orchestration** at the cluster-ops level (not just Dockerfile authorship) | **O*NET (local, verifiable in `data/bls/compact/soc_occupation_compact.csv`):** SOC 15-1244.00 *Network and Computer Systems Administrators* — `skill_complex_problem_solving_lv: 4.0`, `skill_critical_thinking_lv: 3.88`, `skill_systems_analysis_lv: 3.88`; SOC 15-1252.00 *Software Developers* — `skill_critical_thinking_lv: 4.12`. K8s production-ops is the work these levels describe. **Live posting (fetched 2026-06-27):** AWS *Sr. Software Dev Engineer, AWS EKS* — Job ID 10409348, Seattle — title alone establishes EKS/Kubernetes as the role's center, "Apply now" button confirmed live; URL: https://www.amazon.jobs/en/jobs/10409348/sr-software-dev-engineer-aws-eks . **Pattern (WebSearch trail, query `amazon.jobs EKS Kubernetes software development engineer site:amazon.jobs`):** 9 additional EKS / K8s SDE roles on the same Amazon team returned in one query; jobs.sap.com BTP SRE listings require "Experience with Kubernetes and good understanding of container technologies"; Google Careers SRE listings name "containerization and container orchestration technologies such as GKE" as a core requirement (search-aggregator content; live URLs filter daily so the user should re-pin specific Bay Area roles before any engine run that depends on URL liveness). | Docker authoring at Eth Tech (Docker + Fly.io). No multi-node cluster ops. No K8s on resume. | Ship one verifiable artifact, not a course completion: stand up a 3-node k3s/kind cluster on a personal box, deploy the PaddleOCR-VL-1.5 inference service onto it with a real Horizontal Pod Autoscaler driven by request latency, blog the failure modes I hit and how I read `kubectl describe` to find them. Verified-closed when the post is published + the manifests are in a public repo with a CI workflow that re-applies them. |
| 2 | **Production cloud-provider experience (AWS / GCP / Azure)** | Same three postings: each lists at least one of GCP / AWS / Azure as required (Google → GCP, SAP BTP → AWS *or* Azure, Amazon → AWS). On `data/bls/compact/soc_occupation_compact.csv` row for SOC 15-1252.00, the `skill_programming_lv` and `skill_systems_analysis_lv` levels are high enough that scoring rewards demonstrated cloud-platform work, not just hosted-PaaS use. | SAP S/4HANA work was on SAP-managed infrastructure; Fly.io is a hosted PaaS, not a hyperscaler. No AWS / GCP / Azure account work visible to a third party. | Pass one cloud certification with verifiable issuer (AWS SAA or GCP Associate Cloud Engineer) **and** ship one personal project that uses that cloud's primitives (e.g., the K8s cluster from row 1 on GKE/EKS instead of a local box). Verified-closed when the cert ID is on the public profile and the project repo references the cloud resources by name. |
| 3 | **Infrastructure-as-Code (Terraform / Pulumi)** | Same three postings: Google, SAP, AWS all list Terraform *or* CloudFormation as a required skill; this is also the row most often missing in fresh-grad rejections per anecdotal pattern in `r/devops` 2026 threads (low-evidence — anecdote, not a posting). | GitHub Actions CI/CD pipelines from Eth Tech; no IaC. Deployment was scripted, not declared. | Rewrite the row-1 cluster bring-up as a Terraform module that provisions the cloud K8s cluster + IAM + networking; submit a small upstream contribution (a fix or a module README) to a public Terraform provider repo. Verified-closed when the PR merges or is closed with maintainer feedback. |
| 4 | **On-call / production incident response experience** | Patterns across the three postings: SAP BTP SRE explicitly lists "24×7 on-call rotation"; Google SRE asks for "production incident management"; AWS Platform Engineer asks for "experience operating customer-facing services". None of these can be substituted with course work. | Eth Tech ran on third-party model APIs; the resume claims "no service downtime caused by rate limiting" but does not list on-call rotation or postmortem authorship. SAP LCM internship is a release-engineering scope, not a paging scope. | Operate the row-1 cluster as a real service with an SLO (e.g., "p99 inference latency < 800 ms over 7 days"), wire alerts to a personal Pagerduty/Grafana OnCall instance, run for 30 days, and publish one postmortem covering a real outage I caused or observed. The published postmortem is the artifact. |

## Killed row (one — required)

| # | Killed gap | Why it was wrong |
|---|-----------|------------------|
| 5 | ~~**Production Go programming**~~ | The agent's first draft listed Go as a hard gap because the target metro includes Google and the phrase "Google SRE" pattern-matched to Go in the agent's training. Checked against the actual postings: Google SRE accepts "Python, Java, C++, Go, or equivalent" — Go is one path, not a gate. SAP BTP platform work is JVM- and ABAP-heavy; AWS platform work is mostly Python/Java. With Python + Java-adjacent (ABAP) + TypeScript already attested, adding Go would be a costume change, not a closed gap. The row was fluency dressing as a finding — the same failure mode this course exists to catch. |

## Row rewritten in my own words (one — required, restating row 1)

**Why row 1 matters most to me:** the SAP LCM internship taught me what release engineering looks like one rung above scripting — modular workflows, automated testing of a deployable thing — but it was all *inside* the SAP-managed platform, where someone else owns the cluster and the kernel. The honest version of the gap is not "I don't know Kubernetes." It is: **I have never been the person responsible for keeping a multi-node cluster healthy while a real service runs on it.** That is a different job. The proof I owe a hiring manager is not a certificate, it is one weekend where a pod I'm supposed to keep up stays up, and one weekend where it doesn't and I write the postmortem honestly. The PaddleOCR work gives me a real service to put on the cluster — that is the lever I have that most fresh grads don't, and I should use it instead of starting with a tutorial app.

---

### Notes on this file's discipline

- Row 1 grounds its evidence in (a) local O*NET levels from
  `data/bls/compact/soc_occupation_compact.csv` (re-verifiable by anyone
  with the repo), (b) one live posting URL fetched 2026-06-27, and
  (c) a documented WebSearch query trail for the sector pattern.
  Rows 2–4 cite the same O*NET file and similar posting patterns;
  any URL named here may fill or rotate, and re-pinning before an
  engine run that depends on URL liveness is the user's job.
- The plan column states a **closing condition** that someone other than
  me can verify — a published post, a merged PR, a cert ID, a postmortem URL.
- Feelings about the difficulty of any row live in `search/private-notes.md`
  (gitignored), not here.
