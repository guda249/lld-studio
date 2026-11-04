FAKE_CONFIG_FILE = {"region": "ap-south-1", "max_upload_mb": "10"}


class AppConfig:
    loads = 0

    def __init__(self) -> None:
        AppConfig.loads += 1
        self.settings = dict(FAKE_CONFIG_FILE)  # reads the "file" every time

    def get(self, key: str) -> str:
        return self.settings[key]


upload_service_config = AppConfig()
FAKE_CONFIG_FILE["max_upload_mb"] = "50"  # someone edits the file
download_service_config = AppConfig()

print(f"Upload service limit: {upload_service_config.get('max_upload_mb')} MB")
print(f"Download service limit: {download_service_config.get('max_upload_mb')} MB")
print(f"Config file read {AppConfig.loads} times, and the two services now disagree")
