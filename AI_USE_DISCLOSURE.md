# AI Use Disclosure — Setup Exercise (INFO 7375)

**Student:** Mercury (Zhenhao Ma)
**Assignment:** Setup Exercise — Your Search's Personal Layer
**Branch:** `setup-exercise` on `CodecNao/the-reallocation-engine`
**Date:** 2026-06-27

---

**What the AI produced in this exercise and how I used it.** Claude Code
extracted my résumé into structured JSON at `search/resume.json`, drafted the
YAML constraints in `search/profile.yml` from my live intake answers, and
drafted the gap table in `search/gaps.md`; I attested the résumé edits and
named the three import errors myself, set the visa block to *anticipated /
uncertain* rather than asserting STEM eligibility or OPT dates the agent
wanted to round into facts, and confirmed sponsorship as a hard gate before
the branch was pushed.

**One specific thing the AI could not determine that required my judgment.**
The agent could not determine whether the résumé's SAP achievement —
*"Unified cross-platform installation workflows across Windows and Linux"* —
reflected actual Windows work that simply was not bulleted under
Responsibilities, or whether the "Windows" half was an aspirational
generalization from a Linux-only internship; only I know the truthful answer
(the work was Linux-only, with HANA and the SAP platform layered on top), and
I narrowed the JSON achievement to Linux and noted the narrowing in
`attestation_note` on that basis. The agent's "fluent" reading of the résumé
would have left both operating systems in, and a recruiter pattern-matching
on "Windows server engineer" postings would have scored me incorrectly on
work I did not do.
