import subprocess
import shutil
from pathlib import Path

REPO_DIR = Path(__file__).parent.parent
dist_dir = REPO_DIR / "dist"

if not dist_dir.exists():
    print("错误: dist 目录不存在，请先运行构建命令。")
    exit(1)

with open(REPO_DIR / ".github" / "code.txt") as f:
    code = f.read().strip()
    code_dir = REPO_DIR / "webui" / code
    if code_dir.exists():
        shutil.rmtree(code_dir)
    code_dir.mkdir(parents=True, exist_ok=True)

shutil.copytree(dist_dir, code_dir, dirs_exist_ok=True)
# os.system(f'python build/fileUploader.py --dir "{code_dir.parent}"')
subprocess.run(["python", "build/fileUploader.py", "--dir", str(code_dir.parent)])
print(f"代号 {code} 发布完成！")
