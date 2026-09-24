from uuid import uuid4

from .integrations import supabase


BUCKET_NAME = "datasets"


def get_backend_status():
    return {
        "backend": "ok",
        "supabase": "connected" if supabase else "not_configured",
    }


def upload_dataset(file, dataset_name: str):
    if not supabase:
        raise RuntimeError("Supabase is not configured")

    file_extension = ""

    if "." in file.filename:
        file_extension = "." + file.filename.split(".")[-1]

    storage_path = (
        f"{uuid4()}{file_extension}"
    )

    file_content = file.file.read()

    supabase.storage \
        .from_(BUCKET_NAME) \
        .upload(
            storage_path,
            file_content,
            {
                "content-type": file.content_type
                or "application/octet-stream"
            },
        )

    dataset = {
        "name": dataset_name,
        "source_type": "file",
        "source_location": storage_path,
        "status": "uploaded",
    }

    result = (
        supabase
        .table("datasets")
        .insert(dataset)
        .execute()
    )

    return result.data[0]
import io
from uuid import uuid4
from urllib.parse import urlparse

import httpx

from .integrations import supabase


MAX_IMPORT_SIZE = 6 * 1024 * 1024  # 6 MB


def import_dataset_from_url(
    dataset_url: str,
    dataset_name: str,
):
    if supabase is None:
        raise RuntimeError("Supabase is not configured")

    parsed = urlparse(dataset_url)

    if (
        parsed.scheme != "https"
        or parsed.hostname != "data.insideairbnb.com"
        or not parsed.path.lower().endswith(".csv")
        or parsed.username is not None
        or parsed.password is not None
        or parsed.port is not None
    ):
        raise ValueError(
            "Only direct Inside Airbnb CSV URLs are supported"
        )

    # Retrieve data into memory, not the local filesystem.
    content = io.BytesIO()

    with httpx.Client(
        timeout=90,
        follow_redirects=False,
    ) as client:

        with client.stream(
            "GET",
            dataset_url,
        ) as response:

            response.raise_for_status()

            for chunk in response.iter_bytes():
                if content.tell() + len(chunk) > MAX_IMPORT_SIZE:
                    raise ValueError(
                        "Dataset exceeds the 6 MB import limit"
                    )

                content.write(chunk)

    file_bytes = content.getvalue()

    if not file_bytes:
        raise ValueError("Downloaded file is empty")

    # Basic CSV verification.
    first_line = file_bytes[:4096].splitlines()[0]

    if b"," not in first_line:
        raise ValueError(
            "The downloaded file does not appear to be CSV"
        )

    storage_path = f"imports/{uuid4()}.csv"

    supabase.storage.from_("datasets").upload(
        storage_path,
        file_bytes,
        {"content-type": "text/csv"},
    )

    try:
        result = (
            supabase.table("datasets")
            .insert(
                {
                    "name": dataset_name,
                    "description": (
                        "Imported from Inside Airbnb: "
                        + dataset_url
                    ),
                    "source_type": "url",
                    "source_location": storage_path,
                    "status": "uploaded",
                }
            )
            .execute()
        )

        return result.data[0]

    except Exception:
        supabase.storage.from_("datasets").remove(
            [storage_path]
        )
        raise