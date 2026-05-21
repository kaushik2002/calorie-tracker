import os
import uuid
from datetime import datetime, timedelta, timezone
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions


def generate_upload_sas(filename: str) -> dict:
    connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    container_name = os.getenv("AZURE_STORAGE_CONTAINER")

    blob_service_client = BlobServiceClient.from_connection_string(connection_string)
    account_name = blob_service_client.account_name

    # Extract account key from connection string
    account_key = None
    for part in connection_string.split(";"):
        if part.startswith("AccountKey="):
            account_key = part[len("AccountKey="):]
            break

    blob_name = f"{uuid.uuid4()}_{filename}"

    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=container_name,
        blob_name=blob_name,
        account_key=account_key,
        permission=BlobSasPermissions(write=True, create=True),
        expiry=datetime.now(timezone.utc) + timedelta(minutes=10),
    )

    upload_url = f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_name}?{sas_token}"
    blob_url = f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_name}"

    return {"uploadUrl": upload_url, "blobUrl": blob_url}
