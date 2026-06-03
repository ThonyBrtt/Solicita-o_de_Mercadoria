# Revest Bem - Solicitação de Mercadoria

**Objetivo**: Otimizar retirada e movimentação de materiais. Substitui WhatsApp por sistema centralizado, auditável e priorizado.

**Status**:
- ✅ Login (vendedor/admin): Front-End/login.html
- ✅ Design Revest Bem: Css/sing-up.css (bege #f5f2e9 / dourado #d9c9a2)
- ⏳ Home: index.html | Produtos: products.html

**Repo**: [GitHub](https://github.com/ThonyBrtt/Solicita-o_de_Mercadoria) - veja branches/commits.

## Como Rodar

### Backend (FastAPI)

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

O servidor roda em `http://localhost:8000`. As tabelas do banco são criadas automaticamente na inicialização.

### Frontend

Abra o `index.html` no navegador ou use a extensão **Live Server** do VSCode para servir os arquivos estáticos.

O frontend consome a API em `http://localhost:8000` (configurado em `Front-End/js/System.js`).

## Tech Essencial
- HTML5 + Bootstrap 5 + CSS Custom
- FastAPI + Python
- PostgreSQL (Supabase)
- Responsivo, Dark/Light mode
