# FastAPI app entry - import from main.py
from python_worker.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)