from fastapi import APIRouter
from database import get_conn
from pydantic import BaseModel
from enum import Enum

router = APIRouter()

class PerfilUsuario(str, Enum):
    logistica = "logistica"
    vendas  = "vendas"
    administrador = "Administrador"

class UsuarioEntrada(BaseModel):
    nome: str
    usuario: str
    senha: str
    perfil: PerfilUsuario

class LoginEntrada(BaseModel):
    usuario: str
    senha: str

@router.get("/usuarios")
def listar_usuarios():
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, usuario, perfil FROM usuarios")
    usuarios = cursor.fetchall()
    cursor.close()
    conn.close()
    return[
        {
            "id": u[0],
            "nome": u[1],
            "usuario": u[2],
            "perfil": u[3]
        }
        for u in usuarios
    ]

@router.post("/usuarios")
def criar_usuario(usuario: UsuarioEntrada):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""INSERT INTO usuarios (nome, usuario, senha, perfil) 
                   VALUES (%s, %s, %s, %s) RETURNING id""",(
                       usuario.nome,
                       usuario.usuario,
                       usuario.senha,
                       usuario.perfil
                   ))
    novo_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()
    return{"Mensagem": "Usuário criado com sucesso", "id": novo_id}

@router.put("/usuarios/{id}")
def atualizar_usuario(id: int, usuario: UsuarioEntrada):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM usuarios WHERE id = %s", (id,))
    usuario_existente = cursor.fetchone()

    if not usuario_existente:
        cursor.close()
        conn.close()
        return {"Mensagem": "Usuário Não encontrado"}
    
    cursor.execute("UPDATE usuarios SET nome = %s, usuario = %s, senha = %s, perfil = %s WHERE id = %s", (
        usuario.nome,
        usuario.usuario,
        usuario.senha,
        usuario.perfil,
        id
    ))
    conn.commit()
    cursor.close()
    conn.close()
    return {"Mensagem": "Usuário atualizado com sucesso"}


@router.get("/usuarios")
def login(dados: LoginEntrada):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, usuario, perfil FROM usuarios WHERE usuario = %s AND senha = %s",
                   (dados.usuario, dados.senha
    ))
    usuarios = cursor.fetchall()
    cursor.close()
    conn.close()

    if not usuarios:
        return{"Mensagem":  "Usuario não encontrado"}
    
    return{
        "id": usuarios[0],
        "nome": usuarios[1],
        "usuario": usuarios[2],
        "perfil": usuarios[3]
    }

    