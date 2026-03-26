from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.db.mongodb import get_db
from app.config import settings
from bson import ObjectId
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        # Prefer explicit fields; keep `sub` as backward compatibility.
        user_id: Optional[str] = payload.get("user_id") or payload.get("sub")
        token_role: Optional[str] = payload.get("role")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Fetch from DB
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Convert DB result into correct response structure
    return {
        # `user_id` is the canonical identity field used across the backend.
        "user_id": str(user["_id"]),
        # `id` is kept for backward compatibility with parts of the frontend/types.
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user.get("full_name", ""),
        "role": user.get("role") or token_role,
    }
