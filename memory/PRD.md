# AgendaPro - Sistema de Agendamentos

## Problema Original
"Me faça um Sistema de Agendamentos em PHP com:
- Cadastro de serviços e horários disponíveis
- Notificações por e-mail
- Painel para clientes e prestadores"

Adaptado para React + FastAPI + MongoDB conforme alinhado com o usuário.

## Arquitetura
- **Frontend**: React 19 + Tailwind + Shadcn UI (Outfit + Manrope fonts)
- **Backend**: FastAPI + Motor (MongoDB async) + JWT (bcrypt)
- **Banco**: MongoDB (collections: users, services, availability, appointments, reviews)
- **E-mail**: SendGrid (BackgroundTasks)
- **Design**: Cobalt Blue (#4338CA) + Vivid Coral (#FF5A5F), Swiss/High-Contrast

## Personas
1. **Cliente** — busca serviços, reserva, recebe e-mails, pode cancelar/reagendar/avaliar
2. **Prestador** — cadastra serviços, define horários, gerencia agendamentos, confirma/conclui

## Requisitos Implementados (Iteração 1 - 08/02/2026)
- [x] Auth JWT (register/login/logout/me) com dois roles (customer, provider)
- [x] Cadastro/edição/exclusão de serviços (prestador)
- [x] Configuração de horários por dia da semana (múltiplas faixas)
- [x] Cálculo inteligente de slots disponíveis (considera duração + conflitos)
- [x] Fluxo de reserva com calendário Shadcn e grid de horários
- [x] Painéis dedicados para cliente e prestador
- [x] Cancelamento e reagendamento (ambos roles, com regras)
- [x] Confirmação/conclusão pelo prestador
- [x] Avaliações (pós-conclusão) com estrelas + comentário
- [x] Notificações por e-mail via SendGrid (criação, confirmação, cancelamento, reagendamento)
- [x] Estatísticas do prestador (hoje, pendentes, concluídos, receita, nota média)
- [x] Catálogo público com busca e filtro por categoria

## Backlog / Próximas Fases
### P1
- [ ] Lembrete automático 24h antes do agendamento (cron/scheduler)
- [ ] Upload de foto de perfil do prestador (object storage)
- [ ] Página pública do prestador com serviços + reviews
- [ ] Exportar agenda para iCal/Google Calendar

### P2
- [ ] Pagamentos online (Stripe) com marcação de agendamento pago
- [ ] Chat cliente-prestador (in-app)
- [ ] Recorrência (agendamentos semanais/mensais)
- [ ] Multi-localização por prestador
- [ ] Desktop app / PWA
