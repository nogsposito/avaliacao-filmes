from fastapi import APIRouter

from app.movies.router import router as movies_router

api_router = APIRouter()

# Registre aqui os routers dos futuros domínios. Exemplo:
# api_router.include_router(movies_router, prefix="/movies", tags=["movies"])

api_router.include_router(
    movies_router,
    prefix="/movies",
    tags=["movies"],
)