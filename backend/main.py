from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import motor.motor_asyncio
import boto3
import os
import shutil
from detect_words import remove_text_and_logos
from pathlib import Path
from passlib.context import CryptContext
from face_blur import blur_face  
from fastapi.middleware.cors import CORSMiddleware

# MongoDB Setup
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client["mydb"]
posts_collection = db["posts"]

# AWS S3 Setup
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.environ.get("AWS_REGION", "ap-southeast-1")
S3_BUCKET = os.environ.get("S3_BUCKET", "my-bucket")

s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

# Pydantic Models
class ImageModel(BaseModel):
    s3KeyPublic: str
    s3KeyOriginal: Optional[str] = None
    isPrivate: bool = False

class PostModel(BaseModel):
    id: str
    userId: str
    caption: Optional[str] = None
    images: List[ImageModel]
    createdAt: datetime

# Setup password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

# Allow frontend (Vite runs on :5173) to talk to backend (:8000)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # list of allowed origins
    allow_credentials=True,
    allow_methods=["*"],            # allow all methods (POST, GET, etc.)
    allow_headers=["*"],            # allow all headers
)

@app.post("/clean-image/")
async def clean_image(file: UploadFile = File(...)):
    # Save uploaded file
    input_path = Path("input") / file.filename
    input_path.parent.mkdir(exist_ok=True, parents=True)
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run the inpainting
    out_img, _ = remove_text_and_logos(str(input_path))

    # Return the cleaned image
    return FileResponse(out_img, media_type="image/png", filename=Path(out_img).name)

@app.post("/blur-faces/")
async def blur_faces(file: UploadFile = File(...)):
    # Save uploaded file
    input_path = Path("input") / file.filename
    input_path.parent.mkdir(exist_ok=True, parents=True)
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run the inpainting
    out_img = blur_face(str(input_path))


    # Return the blurred image
    return FileResponse(out_img, media_type="image/png", filename=Path(out_img).name)

@app.get("/posts", response_model=List[PostModel])
async def get_for_you_posts():
    posts_cursor = posts_collection.find().sort("createdAt", -1).limit(20)
    posts = await posts_cursor.to_list(length=20)

    result = []
    for post in posts:
        images_with_urls = []
        for img in post.get("images", []):
            public_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{img['s3KeyPublic']}"
            images_with_urls.append({
                "s3KeyPublic": img["s3KeyPublic"],
                "s3KeyOriginal": img.get("s3KeyOriginal"),
                "urlPublic": public_url,
                "isPrivate": img.get("isPrivate", False)
            })
        result.append({
            "id": str(post["_id"]),
            "userId": str(post["userId"]),
            "caption": post.get("caption"),
            "images": images_with_urls,
            "createdAt": post.get("createdAt")
        })

    return result

@app.post("/posts")
async def create_post(
    userId: str = Body(...),
    caption: str = Body(None),
    images: List[ImageModel] = Body(...)
):
    post_data = {
        "userId": ObjectId(userId),
        "caption": caption,
        "images": [img.dict() for img in images],
        "createdAt": datetime.utcnow()
    }
    result = await posts_collection.insert_one(post_data)
    return {"id": str(result.inserted_id)}

@app.post("/posts/open-original")
async def open_original_image(
    postId: str = Body(...),
    imageIndex: int = Body(...),
    password: Optional[str] = Body(None)
):
    # Fetch post from Mongo
    post = await posts_collection.find_one({"_id": ObjectId(postId)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    try:
        image = post["images"][imageIndex]
    except IndexError:
        raise HTTPException(status_code=400, detail="Invalid image index")

    # If image is public, return the public URL
    if not image.get("isPrivate", False):
        url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{image['s3KeyPublic']}"
        return {"url": url}

    # Private image requires password
    if not password:
        raise HTTPException(status_code=401, detail="Password required")

    if "passwordHash" not in image:
        raise HTTPException(status_code=400, detail="No password set for this image")

    # Verify password
    if not pwd_context.verify(password, image["passwordHash"]):
        raise HTTPException(status_code=403, detail="Invalid password")

    # Ensure original exists
    if not image.get("s3KeyOriginal"):
        raise HTTPException(status_code=400, detail="Original image not available")

    # Generate presigned URL (expires in 10 minutes)
    presigned_url = s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": S3_BUCKET, "Key": image["s3KeyOriginal"]},
        ExpiresIn=600
    )
    return {"url": presigned_url}