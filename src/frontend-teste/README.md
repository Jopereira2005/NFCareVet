# NFCareVet - Módulo de Teste Mobile Web NFC (frontend-teste)

Mini projeto frontend responsivo desenvolvido para testar a integração com o backend NestJS e utilizar a biblioteca nativa **Web NFC do Google Chrome no Android** diretamente do celular na rede local à beira do leito.

---

## 🚀 Funcionalidades Principais para Teste

1. **🩺 Modo Consulta (Prontuário Breve & Completo)**:
   - Aproximação da coleira NFC para consulta rápida (`GET /bedside/:identifier`).
   - Suporte a digitação de UID, código público ou seleção de pacientes em teste.
   - **Prontuário Rápido (Breve)**:
     - Dados do paciente (Espécie, raça, idade calculada dinamicamente, peso, baia alocada e tutor).
     - **Alertas Clínicos em Badges** (Jejum, Alergias, Tipo Sanguíneo, Comportamento).
     - **Últimos Sinais Vitais Aferidos** (FC, FR, Temperatura, Pressão PAS/PAD, Glicemia, TPC).
     - **Tarefas & Medicações Pendentes**: listagem com botão para checar e aplicar item (`POST /bedside/items/:id/apply`).
   - **Prontuário Completo**: botão para carregar e expandir prescrições médicas na íntegra e histórico detalhado (`GET /bedside/:identifier/full`).

2. **🔗 Modo Vínculo (Coleira do Animal)**:
   - Fluxo em 2 etapas:
     1. Escanear ou digitar o UID da tag da coleira do animal e armazenar no estado da tela.
     2. Visualizar a lista de pacientes internados ativos e clicar em "Vincular Coleira Lida" (`POST /hospitalizations/patient/:patientId/link-tag`).
   - Opção para desvincular a coleira liberando-a de volta para o inventário (`POST /hospitalizations/patient/:patientId/unlink-tag`).

3. **⏱️ Linha do Tempo Clínica (Timeline)**:
   - Seleção do paciente internado.
   - Visualização cronológica dos eventos (`GET /hospitalizations/:id/timeline`), incluindo aferição de sinais vitais, alimentação, medicações e intercorrências.
   - Filtros por tipo de evento e paginação completa (Anterior / Próxima).

4. **📊 Resumo Temporal (Dashboard)**:
   - Indicadores consolidados do hospital (`GET /hospitalizations/stats/summary`):
     - Hoje (Admissões, Altas, Pacientes Ativos).
     - Últimos 7 dias (Admissões e Altas).
     - Mês atual (Admissões e Altas).
     - Ocupação hospitalar em tempo real (% com barra de progresso visual).

5. **🏷️ Ferramentas NFC (Inventário & Gravação de URL)**:
   - Inserir tags no inventário (`POST /nfc-tags`).
   - Gravação física de registros NDEF do tipo URL no chip NFC via API Web NFC (`NDEFReader.write`).

---

## 📱 Como Rodar e Acessar pelo Celular

### 1. Iniciar o Backend (no computador)
```bash
npm run dev:backend
```
O backend ficará acessível na porta `3000` (ex: `http://192.168.1.29:3000`).

### 2. Iniciar o Frontend de Teste (no computador)
Na raiz do projeto:
```bash
npm run dev:teste
```
Ou dentro da pasta `src/frontend-teste`:
```bash
npm run dev:host
```
Ele será iniciado na porta **5174** ouvindo em todas as interfaces de rede (`0.0.0.0`).

### 3. Acessar no Chrome do Celular

1. Conecte o celular na **mesma rede Wi-Fi** do computador.
2. Descubra o IP local do seu computador na rede (ex: `192.168.1.29`).
3. No Google Chrome do celular, acesse:
   ```
   http://192.168.1.29:5174
   ```

#### ⚠️ Requisito de Segurança do Chrome para Web NFC:
O Google Chrome no Android restringe a API Web NFC (`NDEFReader`) a origens seguras. Para utilizá-la em rede local via HTTP:
1. No Chrome do celular, abra a URL:
   ```
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```
2. Ative a flag (**Enabled**).
3. No campo de texto que aparece, digite a origem exata do seu app:
   ```
   http://192.168.1.29:5174
   ```
4. Toque no botão **Relaunch** para reiniciar o Chrome.
5. Pronto! O Chrome liberará o acesso à antena NFC e à API `window.NDEFReader`.

---

## 🔑 Autenticação Rápida Integrada

O aplicativo conta com login de 1 clique pré-configurado com os dados padrão do seed:
- **Veterinária**: `madalena@nfcarevet.com` (senha: `vet12345`)
- **Admin**: `admin@nfcarevet.com` (senha: `admin123`)
