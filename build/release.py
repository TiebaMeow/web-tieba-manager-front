import asyncio
import os
from pathlib import Path
import aiohttp  # type: ignore


async def upload_asset(token: str, upload_url: str, asset_path: str):
    """
    Uploads a release asset to GitHub.
    """
    if not all([token, upload_url, asset_path]):
        raise ValueError(
            "Missing GITHUB_TOKEN, UPLOAD_URL, or ASSET_PATH environment variables."
        )

    asset_file = Path(asset_path)
    if not asset_file.is_file():
        raise FileNotFoundError(f"Asset file not found at: {asset_path}")

    asset_name = asset_file.name
    # The upload_url from the create-release action has a {?name,label} template.
    # We need to strip it and add the query parameters ourselves.
    url = upload_url.split("{")[0] + f"?name={asset_name}"

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/octet-stream",
    }

    print(f"Uploading {asset_name} to {url}...")

    async with aiohttp.ClientSession() as session:
        with open(asset_file, "rb") as f:
            async with session.post(
                url, data=f, headers=headers, timeout=300
            ) as response:
                response.raise_for_status()
                result = await response.json()
                print(f"Successfully uploaded {asset_name}.")
                print(f"Download URL: {result['browser_download_url']}")


if __name__ == "__main__":
    github_token = os.getenv("GITHUB_TOKEN", "")
    asset_upload_url = os.getenv("UPLOAD_URL", "")
    file_path = os.getenv("ASSET_PATH", "")

    try:
        asyncio.run(upload_asset(github_token, asset_upload_url, file_path))
    except (ValueError, FileNotFoundError, aiohttp.ClientError) as e:
        print(f"Error: {e}")
        exit(1)
