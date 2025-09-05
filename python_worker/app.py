# FastAPI app entry
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"msg": "Medical Student Study Hub Python Worker running"}