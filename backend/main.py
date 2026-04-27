from fastapi import FastAPI
from models import criar_tabelas
from routers import produtos

app = FastAPI()

criar_tabelas()

app.include_router(produtos.router)

@app.get("/")
def raiz():
    return {"mensagem": "Olá Mundo!"}

#uvicorn main:app <- Rodar o servidor de desenvolvimento