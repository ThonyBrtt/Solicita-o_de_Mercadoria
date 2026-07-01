from fastapi import APIRouter
from database import get_conn
from pydantic import BaseModel
from enum import Enum
from utils import hash_senha, verificar_senha

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
    email: str

class LoginEntrada(BaseModel):
    usuario: str
    senha: str

@router.get("/usuarios")
def listar_usuarios():
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, usuario, perfil, email FROM usuarios")
    usuarios = cursor.fetchall()
    cursor.close()
    conn.close()
    return[
        {
            "id": u[0],
            "nome": u[1],
            "usuario": u[2],
            "perfil": u[3],
            "email": u[4]
        }
        for u in usuarios
    ]


@router.post("/usuarios")
def criar_usuario(usuario: UsuarioEntrada):
    conn = get_conn()
    cursor = conn.cursor()
    senha_hash = hash_senha(usuario.senha)
    cursor.execute("""INSERT INTO usuarios (nome, usuario, senha, perfil, email) 
                   VALUES (%s, %s, %s, %s, %s) RETURNING id""",(
                       usuario.nome,
                       usuario.usuario,
                       senha_hash,
                       usuario.perfil,
                       usuario.email
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
    
    senha_hash = hash_senha(usuario.senha)
    cursor.execute("UPDATE usuarios SET nome = %s, usuario = %s, senha = %s, perfil = %s, email = %s WHERE id = %s", (
        usuario.nome,
        usuario.usuario,
        senha_hash,
        usuario.perfil,
        usuario.email,
        id
    ))
    conn.commit()
    cursor.close()
    conn.close()
    return {"Mensagem": "Usuário atualizado com sucesso"}


@router.post("/login")
def login(dados: LoginEntrada):
    conn = get_conn()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, nome, usuario, perfil, email, senha FROM usuarios WHERE usuario = %s",
        (dados.usuario,)
    )
    usuario = cursor.fetchone()
    
    if not usuario or not verificar_senha(dados.senha, usuario[5]):
        cursor.close()
        conn.close()
        return {"erro": "Usuário ou senha incorretos"}
    
    cursor.close()
    conn.close()
    
    return {
        "id": usuario[0],
        "nome": usuario[1],
        "usuario": usuario[2],
        "perfil": usuario[3],
        "email": usuario[4]
    }

@router.delete("/usuarios/{id}")
def excluir_usuario(id: int):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM usuarios WHERE id = %s", (id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        return {"erro": "Usuário não encontrado"}

    cursor.execute("DELETE FROM usuarios WHERE id = %s", (id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"mensagem": "Usuário excluído com sucesso"}