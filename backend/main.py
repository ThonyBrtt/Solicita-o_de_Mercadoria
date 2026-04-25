from fastapi import FastAPI
from models import criar_tabelas

app = FastAPI()

criar_tabelas()

@app.get("/")
def raiz():
    return {"mensagem": "Olá Mundo!"}

#uvicorn main:app <- Rodar o servidor de desenvolvimento