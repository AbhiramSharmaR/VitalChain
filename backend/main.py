from fastapi import FastAPI
from routes import patient, access

app = FastAPI()

app.include_router(patient.router)
app.include_router(access.router)