from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import criar_tabelas
from routers import produtos, solicitacoes, usuarios
from routers import dashboard

app = FastAPI()

origins = [
    "http://localhost:5500",   # front rodando com python http.server
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

criar_tabelas()

app.include_router(produtos.router)

app.include_router(solicitacoes.router)

app.include_router(usuarios.router)

app.include_router(dashboard.router)

@app.get("/")
def raiz():
    return {"mensagem": "Olá Mundo!"}