from fastapi import FastAPI
from models import criar_tabelas
from routers import produtos, solicitacoes

app = FastAPI()

criar_tabelas()

app.include_router(produtos.router)

app.include_router(solicitacoes.router)

@app.get("/")
def raiz():
    return {"mensagem": "Olá Mundo!"}