from fastapi import APIRouter
from database import get_conn
from pydantic import BaseModel

router = APIRouter()

class UsuarioEntrada(BaseModel):
    nome: str
    email: str
    senha: str
    perfil: str