"""Protected ZIP-to-GitHub publishing gateway for Zone Clock."""
import base64
import hashlib
import hmac
import io
import os
import re
import zipfile
from pathlib import PurePosixPath
import httpx
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

MAX_ZIP = 230 * 1024 * 1024
MAX_EXPANDED = 520 * 1024 * 1024
MAX_FILE = 95 * 1024 * 1024
MAX_FILES = 650
REPO = os.getenv("GITHUB_REPO", "sevynnewma935-max/stalker2-zone-clock")
BRANCH = os.getenv("GITHUB_BRANCH", "main")
ORIGIN = os.getenv("ALLOWED_ORIGIN", "").rstrip("/")
app = FastAPI(title="Zone Clock Publisher", docs_url=None, redoc_url=None)
if ORIGIN:
    app.add_middleware(CORSMiddleware, allow_origins=[ORIGIN],
                       allow_methods=["POST", "GET"],
                       allow_headers=["X-Publish-Password", "Content-Type"])

@app.get("/health")
async def health():
    return {"status": "ok", "configured": bool(os.getenv("PUBLISH_PASSWORD") and os.getenv("GITHUB_TOKEN"))}

async def gh(client, method, path, **kwargs):
    response = await client.request(method, "https://api.github.com" + path, **kwargs)
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"GitHub API {response.status_code}: {response.text[:250]}")
    return response.json()

@app.post("/publish")
async def publish(file: UploadFile = File(...), x_publish_password: str = Header(default="")):
    password, token = os.getenv("PUBLISH_PASSWORD", ""), os.getenv("GITHUB_TOKEN", "")
    if not password or not token:
        raise HTTPException(503, "Configure PUBLISH_PASSWORD and GITHUB_TOKEN on Render")
    if not hmac.compare_digest(x_publish_password.encode(), password.encode()):
        raise HTTPException(401, "Incorrect administrator password")
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(400, "Choose a ZIP archive")
    buffer = bytearray()
    while chunk := await file.read(1024 * 1024):
        buffer.extend(chunk)
        if len(buffer) > MAX_ZIP:
            raise HTTPException(413, "ZIP exceeds 230 MB")
    try:
        archive = zipfile.ZipFile(io.BytesIO(buffer))
    except zipfile.BadZipFile:
        raise HTTPException(400, "Invalid ZIP")
    with archive:
        members = [x for x in archive.infolist() if not x.is_dir()]
        if len(members) > MAX_FILES or sum(x.file_size for x in members) > MAX_EXPANDED:
            raise HTTPException(413, "Unpacked archive too large")
        collected = {}
        for entry in members:
            segments = PurePosixPath(entry.filename.replace("\\", "/")).parts
            if (not segments or ".." in segments or entry.filename.startswith("/") or
                entry.file_size > MAX_FILE or any(x.startswith(".") for x in segments) or
                entry.external_attr >> 16 & 0o170000 == 0o120000):
                raise HTTPException(400, "Unsafe archive member")
            if len(segments) > 1 and segments[0].startswith("stalker2-zone-clock"):
                segments = segments[1:]
            path = "/".join(segments)
            if not path or path in collected:
                raise HTTPException(400, "Duplicate ZIP entry")
            with archive.open(entry) as f:
                content = f.read(MAX_FILE + 1)
            if len(content) > MAX_FILE:
                raise HTTPException(413, "File too large")
            collected[path] = content
    html = collected.get("index.html", b"").decode("utf-8", "replace")
    version = re.search(r"ZONE CLOCK\s*<strong>\s*(v\d+\\.\d+)\s*</strong>", html)
    if not version or "app.js" not in collected or "service-worker.js" not in collected:
        raise HTTPException(400, "Invalid Zone Clock build")
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
               "X-GitHub-Api-Version": "2022-11-28"}
    async with httpx.AsyncClient(headers=headers, timeout=120) as client:
        ref = await gh(client, "GET", f"/repos/{REPO}/git/ref/heads/{BRANCH}")
        head = ref["object"]["sha"]
        commit = await gh(client, "GET", f"/repos/{REPO}/git/commits/{head}")
        tree = commit["tree"]["sha"]
        current = await gh(client, "GET", f"/repos/{REPO}/git/trees/{tree}?recursive=1")
        if current.get("truncated"):
            raise HTTPException(502, "GitHub tree truncated")
        known = {i["path"]: i["sha"] for i in current["tree"] if i["type"] == "blob"}
        changed = []
        for path, content in collected.items():
            blob_hash = hashlib.sha1(b"blob " + str(len(content)).encode() + b"\0" + content).hexdigest()
            if known.get(path) == blob_hash:
                continue
            blob = await gh(client, "POST", f"/repos/{REPO}/git/blobs",
                            json={"content": base64.b64encode(content).decode(), "encoding": "base64"})
            changed.append({"path": path, "mode": "100644", "type": "blob", "sha": blob["sha"]})
        if not changed:
            return {"status": "unchanged", "version": version.group(1)}
        new_tree = await gh(client, "POST", f"/repos/{REPO}/git/trees",
                            json={"base_tree": tree, "tree": changed})
        new_commit = await gh(client, "POST", f"/repos/{REPO}/git/commits",
                              json={"message": f"Publish Zone Clock {version.group(1)} from mobile",
                                    "tree": new_tree["sha"], "parents": [head]})
        await gh(client, "PATCH", f"/repos/{REPO}/git/refs/heads/{BRANCH}",
                 json={"sha": new_commit["sha"], "force": False})
    return {"status": "published", "version": version.group(1),
            "changed_files": len(changed), "commit": new_commit["sha"]}
