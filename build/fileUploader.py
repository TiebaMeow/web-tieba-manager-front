import os
import asyncio
import argparse
from pathlib import Path
import platform

import aiohttp

KEY = os.getenv("KEY")
SERVER = os.getenv("SERVER")

if not KEY or not SERVER:
    print("错误: 请确保环境变量 KEY 和 SERVER 已正确设置。")
    exit(1)

UPLOAD_URL = SERVER
HEADERS = {"key": KEY}


async def upload_file(
    session: aiohttp.ClientSession, file_path: Path, base_dir: Path, prefix: str = ""
):
    """
    上传单个文件到服务器。

    Args:
        session: aiohttp.ClientSession 对象.
        file_path: 要上传的文件的绝对路径.
        base_dir: 命令行 --dir 参数指定的根目录.
        prefix: 日志前缀，用于标识当前上传的文件序号.
    """
    relative_path = file_path.relative_to(base_dir)
    data = aiohttp.FormData()
    try:
        with file_path.open("rb") as f:
            data.add_field(
                "file",
                f,
                filename=file_path.name,
                content_type="application/octet-stream",
            )

            # print(f"{prefix}正在上传: {relative_path}...")

            async with session.post(
                UPLOAD_URL,
                headers=HEADERS,
                data=data,
                params={"path": str(relative_path)},
            ) as response:
                if response.status == 200:
                    print(f"{prefix}上传成功: {relative_path}")
                    return True
                else:
                    error_detail = await response.text()
                    print(
                        f"{prefix}上传失败: {relative_path}, 状态码: {response.status}, 原因: {error_detail}"
                    )
                    return False
    except aiohttp.ClientError as e:
        print(f"上传时发生网络错误: {relative_path}, 错误: {e}")
        return False


async def main():
    """
    主函数，处理命令行参数并启动上传过程。
    """
    parser = argparse.ArgumentParser(description="递归上传文件夹内所有文件。")
    parser.add_argument(
        "--dir",
        type=str,
        required=True,
        help="要上传的文件夹路径。",
    )
    args = parser.parse_args()

    base_dir = Path(args.dir).resolve()
    if not base_dir.is_dir():
        print(f"错误: 路径 '{base_dir}' 不是一个有效的文件夹。")
        return

    files_to_upload = [f for f in base_dir.rglob("*") if f.is_file()]
    if not files_to_upload:
        print(f"文件夹 '{base_dir}' 中没有找到要上传的文件。")
        return

    async with aiohttp.ClientSession() as session:
        total = len(files_to_upload)
        for idx, file_path in enumerate(files_to_upload, 1):
            prefix = f"[{idx}/{total}] "
            success = await upload_file(session, file_path, base_dir, prefix)
            if not success:
                print("由于上传失败，已停止后续所有上传任务。")
                break
        else:
            print("所有文件上传任务已完成。")


if __name__ == "__main__":
    # 确保在 Windows 上 aiohttp 可以正常运行
    if platform.system() == "Windows":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
