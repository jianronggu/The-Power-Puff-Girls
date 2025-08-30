from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
import shutil
from detect_words import remove_text_and_logos
from pathlib import Path
from face_blur import blur_face  


app = FastAPI()

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