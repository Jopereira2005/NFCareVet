# NFCareVet - Módulo de Teste Mobile Web NFC (frontend-teste)

Mini projeto frontend desenvolvido para testar a integração com o backend NestJS e utilizar a biblioteca nativa **Web NFC do Google Chrome no Android** diretamente do celular na rede local.

---

## 🚀 Funcionalidades Principais

1. **Inserir Tag no Inventário**:
   - Aproximação da tag NFC no celular para leitura automática do UID físico (`event.serialNumber`).
   - Opção para digitação manual ou simulação de UID para testes rápidos.
   - Envia para o backend (`POST /nfc-tags`) gerando o código público (`publicCode`) e a URL do leito (`targetUrl`).
   - Listagem das tags cadastradas no inventário em tempo real.

2. **Cadastrar / Gravar URL na Tag NFC**:
   - Gravação física no chip NFC utilizando a API Web NFC (`NDEFReader.write`).
   - Escreve um registro NDEF do tipo URL (`recordType: "url"`).
   - Ao aproximar qualquer smartphone com NFC da tag gravada, o navegador abre a página do leito/paciente.

3. **Alterar Paciente Vinculado à Tag**:
   - Lista todas as internações ativas (`GET /hospitalizations/active`) com os dados do paciente, baia/canil e tag atual.
   - Permite vincular uma tag física (lida via NFC ou selecionada do inventário) ao paciente.
   - Se a tag já estiver em uso por outro leito, realiza a transferência segura (desvinculando do anterior e vinculando ao novo).
   - Opção para desvincular a tag liberando-a para reuso.

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
1. No Chrome do celular, abra a URL especial:
   ```
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```
2. Ative a flag (**Enabled**).
3. No campo de texto que aparece, digite a origem exata do seu app:
   ```
   http://192.168.1.29:5174
   ```
4. Toque no botão **Relaunch** para reiniciar o Chrome.
5. Pronto! O Chrome liberará o acesso à antena NFC e à API `window.NDEFReader` para a aplicação.

---

## 🔑 Autenticação Rápida Integrada

O aplicativo conta com login de 1 clique pré-configurado com os dados padrão do seed:
- **Admin**: `admin@nfcarevet.com` (senha: `admin123`)
- **Veterinária**: `madalena@nfcarevet.com` (senha: `vet12345`)
- Suporte a alteração dinâmica da URL da API pelo cabeçalho da aplicação.
