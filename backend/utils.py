import bcrypt

def hash_senha(senha: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(senha.encode('utf-8'), salt).decode('utf-8')

def verificar_senha(senha: str, hash_armazenado: str) ->bool:
    return bcrypt.checkpw(senha.encode('utf-8'), hash_armazenado.encode('utf-8'))