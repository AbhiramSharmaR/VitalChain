from fastapi import FastAPI
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.api.auth import router as auth_router
from app.api.patients import router as patients_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.models import APIKey, APIKeyIn, SecuritySchemeType
from fastapi.openapi.utils import get_openapi
#from app.api.doctors import router as doctor_router
from app.api.family import router as family_router
from app.api.prescriptions import router as prescriptions_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.symptoms import router as symptoms_router
#from app.api.ai import router as ai_router


app = FastAPI()

origins = [
    "http://localhost:8080",
    "http://localhost:5173",
]

@app.on_event("startup")
async def startup():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown():
    await close_mongo_connection()

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="Healthcare Backend",
        version="1.0",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }

    for path in openapi_schema["paths"]:
        for method in openapi_schema["paths"][path]:
            if "security" in openapi_schema["paths"][path][method]:
                openapi_schema["paths"][path][method]["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

app.include_router(auth_router)
app.include_router(patients_router)
#app.include_router(doctor_router)
app.include_router(family_router)
app.include_router(prescriptions_router)
#app.include_router(ai_router)
app.include_router(symptoms_router)

app.include_router(patients_router, prefix="/patients", tags=["Patients"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)