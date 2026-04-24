from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def raiz():
    return {"mensagem": "Olá Mundo!"}

#uvicorn main:app <- Rodar o servidor de desenvolvimento