from fastapi import APIRouter
from database import get_conn
from pydantic import BaseModel

router = APIRouter()

class UsuarioEntrada(BaseModel):
    nome: str
    email: str
    senha: str
    perfil: str

@router.get("/usuarios")
def listar_usuarios():
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, email, perfil FROM usuarios")
    usuarios = cursor.fetchall()
    cursor.close()
    conn.close()
    return{
        {
            "id": usuarios [0],
            "nome": usuarios [1],
            "email": usuarios [2],
            "perfil": usuarios [3]
        }
        for usuarios in usuarios
    }

@router.post("/usuarios")
def criar_usuario(usuario: UsuarioEntrada):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""INSERT INTO usuarios (nome, email, senha, perfil) 
                   VALUES (%s, %s, %s, %s) RETURNING id""",(
                       usuario.nome,
                       usuario.email,
                       usuario.senha,
                       usuario.perfil
                   ))
    novo_id = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return{"Mensagem": "Usuário criado com sucesso", "id": novo_id}

@router.put("/usuarios/{id}")
def atualizar_usuario(id: int, usuario: UsuarioEntrada):
    conn = get_con()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM usuarios WHERE id = %s", (id,))
    usuario_existente = cursor.fetchone()

    if not usuario_existente:
        cursor.close()
        conn.close()
        return {"Mensagem": "Usuário Não encontrado"}
    
    cursor.execute("UPDATE usuarios SET nome = %s, email = %s, senha = %s, perfil = %s WHERE id = %s", (
        usuario.nome,
        usuario.email,
        usuario.senha,
        usuario.perfil,
        id
    ))
    cursor.close()
    conn.close()
    return {"Mensagem": "Usuário atualizado com sucesso"}
