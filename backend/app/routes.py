import httpx

from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from pydantic import BaseModel, HttpUrl

from .integrations import supabase
from .services import (
    get_backend_status,
    upload_dataset,
    import_dataset_from_url,
)


router = APIRouter(prefix="/api")


# -------------------------
# Request models
# -------------------------

class URLImportRequest(BaseModel):
    name: str
    url: HttpUrl


# -------------------------
# Health check
# -------------------------

@router.get("/health")
def health():
    return get_backend_status()


# -------------------------
# List datasets
# -------------------------

@router.get("/datasets")
def get_datasets():
    if supabase is None:
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured",
        )

    try:
        result = (
            supabase.table("datasets")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )

        return {"datasets": result.data}

    except Exception as error:
        print(f"Dataset listing failed: {error}")

        raise HTTPException(
            status_code=500,
            detail="Could not load datasets",
        )


# -------------------------
# Upload local file
# -------------------------

@router.post("/datasets")
def create_dataset(
    name: str = Form(...),
    file: UploadFile = File(...),
):
    allowed_extensions = (".csv", ".xlsx", ".xls")

    if (
        not file.filename
        or not file.filename.lower().endswith(
            allowed_extensions
        )
    ):
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are supported",
        )

    if not name.strip():
        raise HTTPException(
            status_code=400,
            detail="Dataset name cannot be empty",
        )

    try:
        dataset = upload_dataset(
            file,
            name.strip(),
        )

        return {
            "success": True,
            "dataset": dataset,
        }

    except Exception as error:
        print(f"Dataset upload failed: {error}")

        raise HTTPException(
            status_code=500,
            detail="Dataset upload failed",
        )


# -------------------------
# Import dataset from URL
# -------------------------

@router.post("/datasets/import-url")
def import_dataset(request: URLImportRequest):

    if not request.name.strip():
        raise HTTPException(
            status_code=400,
            detail="Dataset name cannot be empty",
        )

    try:
        dataset = import_dataset_from_url(
            dataset_url=str(request.url),
            dataset_name=request.name.strip(),
        )

        return {
            "success": True,
            "dataset": dataset,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except httpx.HTTPStatusError:
        raise HTTPException(
            status_code=502,
            detail="Source website rejected the download",
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to the dataset source",
        )

    except Exception as error:
        print(f"URL import failed: {error}")

        raise HTTPException(
            status_code=500,
            detail="Dataset import failed",
        )