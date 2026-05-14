# AgendaPro

> Sistema de Agendamentos — MVP Completo

![Tests](https://img.shields.io/badge/testes-37%2F37-22c55e?style=flat-square)
![Stack](https://img.shields.io/badge/stack-FastAPI%20%2B%20Next.js-1E50C8?style=flat-square)
![Auth](https://img.shields.io/badge/auth-JWT%20%2B%20bcrypt-7F77DD?style=flat-square)
![Email](https://img.shields.io/badge/email-SendGrid-E8552B?style=flat-square)
![Warning](https://img.shields.io/badge/⚠%20sender-não%20verificado-fbbf24?style=flat-square)

---

## Visão geral

Plataforma completa de agendamentos com painéis distintos para clientes e prestadores de serviço, fluxo de reservas com cálculo automático de slots disponíveis e notificações por e-mail via SendGrid.

Design vibrante: **Cobalt Blue + Coral**, fontes **Outfit + Manrope**, split-screen no registro e hero 3D animado.

---

## Features

| Módulo | Descrição |
|---|---|
| **Auth JWT** | Login separado para clientes e prestadores com bcrypt e painéis por role |
| **Gestão de serviços** | Cadastro, edição, catálogo público com busca e filtro por categoria |
| **Horários flexíveis** | Configuração por dia da semana com múltiplas faixas de horário |
| **Fluxo de reserva** | Calendário Shadcn com slots automáticos — considera duração e conflitos |
| **Ciclo de vida** | Criar, confirmar, cancelar, reagendar e concluir agendamentos |
| **Avaliações** | Estrelas + comentário por agendamento concluído |
| **Notificações** | E-mails em criação, confirmação, cancelamento e reagendamento |
| **Dashboard prestador** | Hoje, pendentes, concluídos, receita e nota média com banner personalizado |

---

## Testes

```
Backend: 37/37 ✅ (100%)
```

Backend 100% coberto via testing agent. 1 bug crítico encontrado e corrigido — `ObjectId` vazando no endpoint de registro.

---

## ⚠️ SendGrid — ação necessária

O remetente `noreply@agendapro.com` **ainda não está verificado**. E-mails são disparados em background mas retornam **403** até a verificação ser concluída.

**Para ativar:**

1. Acesse **SendGrid → Settings → Sender Authentication**
2. Verifique um e-mail (Single Sender) ou domínio
3. Atualize `SENDER_EMAIL` no `backend/.env` e reinicie o servidor

---

## Stack

**Backend**
- FastAPI (Python) + Uvicorn
- MongoDB (via Motor async)
- JWT + bcrypt
- SendGrid (BackgroundTasks)

**Frontend**
- Next.js 14 (App Router)
- Shadcn/UI + Tailwind CSS
- Fontes: Outfit + Manrope
- Design: Cobalt Blue (#1E50C8) + Coral (#E8552B)

---

## Setup rápido

```bash
git clone https://github.com/seu-usuario/agendapro
cd agendapro

# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # preencha as variáveis
uvicorn main:app --reload

# Frontend
cd ../frontend
npm install
npm run dev
```

---

## Variáveis de ambiente

Crie `backend/.env` a partir do `.env.example`:

| Variável | Descrição |
|---|---|
| `MONGO_URL` | URI de conexão MongoDB |
| `JWT_SECRET` | Segredo para assinar tokens JWT |
| `SENDGRID_API_KEY` | Chave API do SendGrid |
| `SENDER_EMAIL` | Remetente verificado no SendGrid |
| `FRONTEND_URL` | URL do frontend (ex: `http://localhost:3000`) |

---

## Credenciais de teste

Crie livremente via tela de registro — clientes ou prestadores de serviço. Credenciais documentadas em `/app/memory/test_credentials.md`.

---

*AgendaPro MVP · Backend 37/37 · Cobalt Blue + Coral · Outfit + Manrope*
