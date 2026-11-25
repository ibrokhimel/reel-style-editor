"""Create or refresh the Remotion project from the skill template.

usage: python setup_project.py PROJECT_DIR [--update-src]

- New folder: copies template/ and runs `npm install` (~400 MB node_modules, once).
- Existing folder: leaves it alone unless --update-src, which overwrites src/ with the template's
  (do that after the skill template changed; your public/ media and edit.json are untouched).
"""
import argparse, os, shutil, subprocess, sys

TEMPLATE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "template")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--update-src", action="store_true")
    a = ap.parse_args()
    p = os.path.abspath(a.project)
    os.makedirs(p, exist_ok=True)
    for name in os.listdir(TEMPLATE):
        src, dst = os.path.join(TEMPLATE, name), os.path.join(p, name)
        if os.path.isdir(src):
            if name == "src" and a.update_src and os.path.isdir(dst):
                shutil.rmtree(dst)
            if not os.path.exists(dst):
                shutil.copytree(src, dst)
        elif not os.path.exists(dst):
            shutil.copy2(src, dst)
    for d in ("public", "out", "tmp"):
        os.makedirs(os.path.join(p, d), exist_ok=True)
    if not os.path.isdir(os.path.join(p, "node_modules")):
        npm = "npm.cmd" if os.name == "nt" else "npm"
        subprocess.run([npm, "install", "--no-audit", "--no-fund"], cwd=p, check=True)
    print("project ready:", p)


if __name__ == "__main__":
    sys.exit(main())
