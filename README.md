# Fly2Gether ✈️🤝

**Fly2Gether** é um sistema inteligente de busca e sincronização de voos projetado para facilitar o planejamento de viagens em dupla. Se você e seu parceiro(a), amigo(a) ou colega moram em cidades diferentes (duas origens) e querem se encontrar em um destino comum, o Fly2Gether calcula todas as combinações ideais de passagens, sincroniza os horários de chegada na ida e decolagem na volta, e prioriza os melhores preços dentro de uma margem de tolerância.

O sistema opera com um mecanismo híbrido de coleta de dados (**Google Flights via Puppeteer + SerpAPI**) integrado a um banco de dados MongoDB com cache inteligente de 24 horas e envio automatizado de alertas de preços por e-mail.

---

## 🌟 Principais Funcionalidades

### 1. Modos de Busca
*   **Busca Individual**: Permite pesquisar voos normais (ida ou ida/volta) de forma convencional.
*   **Modo Fly Together**: Insira duas origens distintas (ex: *Chapecó - XAP* e *Teresina - THE*) e um destino comum (ex: *São Paulo - GRU*). O sistema gera e combina todas as opções possíveis de voos para que ambos os viajantes cheguem e retornem em sincronia.

### 2. Sincronia Inteligente & Tolerância de Horários
*   **Sincronia Total (Ordenação Padrão)**: Ordena os resultados avaliando a menor discrepância somada dos horários de pouso na ida e de decolagem na volta do destino.
*   **Filtro de Tolerância Reativo**: Barra de ajuste deslizante na interface que limita a diferença de horários entre os viajantes (de `0m (Exato)` a `12h` ou `Qualquer`). 
    *   *Regra de Margem Combinada (Média)*: O filtro avalia a média aritmética dos desvios de ida e volta do par.
    *   *Ordenação Econômica*: Com qualquer limite ativo, a ordenação de Sincronia prioriza automaticamente as opções de **menor preço combinado** que atendem à margem.

### 3. Filtros Avançados & Acessibilidade
*   **Filtro de Escalas Unificado**: Permite filtrar por voos "Diretos" ou "Com Escalas", validando rigorosamente todos os 4 trechos da viagem da dupla.
*   **Ocultar Troca de Aeroporto**: Filtra conexões que exijam mudança de terminais ou aeroportos na mesma cidade (ex: pousar em Congonhas e decolar de Guarulhos).
*   **Filtro de Linhas Aéreas Unificado**: Desmarcar uma companhia remove voos dela para ambos os viajantes.
*   **Busca Inteligente Sem Acentos**: A busca de cidades e aeroportos ignora acentuações e diacríticos (ex: pesquisar "Sao Paulo" ou "Chapecó" funciona perfeitamente).
*   **Visual de Alta Legibilidade**: Ajustado para o conforto visual em computadores, com fontes e detalhes de aeronaves ampliados.

### 4. Alertas de Preço por E-mail
*   Cadastre alertas para rotas e datas específicas. O sistema monitora oscilações de tarifas em background e notifica você via **Resend API** sempre que encontrar preços mais baixos.

---

## 🏗️ Arquitetura e Fluxo de Cache (SWR)

O Fly2Gether utiliza a estratégia **Stale-While-Revalidate (SWR)** para garantir buscas instantâneas e economizar recursos:

```
[ Usuário pesquisa rota no App ]
               │
               ▼
   [ Existe no MongoDB Cache? ]
        ├── Sim (Menos de 24h) ──> Retorna IMEDIATAMENTE (Exibição instantânea)
        │                          E revalida em background via Scraper local/nuvem.
        └── Não/Expirado ────────> Executa a consulta ao vivo (SerpAPI) 
                                   E atualiza o cache do MongoDB.
```

*   **Scraper local**: Se o sistema rodar localmente (`NODE_ENV=development` ou `RUN_SCRAPER_LOCALLY=true`), a revalidação em background abre um navegador Puppeteer silencioso no próprio computador para atualizar o banco.
*   **Scraper na nuvem (Produção)**: Em produção, o backend do Vercel envia uma chamada de API (*Repository Dispatch*) para o **GitHub Actions** do seu repositório para rodar a raspagem em uma máquina virtual e gravar os resultados no MongoDB Atlas.

---

## 🛠️ Tecnologias Utilizadas

*   **Frontend**: React.js, Vite, Tailwind CSS, Lucide React (Ícones).
*   **Backend**: Node.js, Express.js, Axios.
*   **Banco de Dados**: MongoDB (Mongoose).
*   **Robô / Scraper**: Puppeteer (Automação de navegador para o Google Flights).
*   **Alertas**: Node-cron (Monitoramento local) e Resend (Disparo de e-mails).

---

## ⚙️ Variáveis de Ambiente (`.env`)

Crie um arquivo `.env` na raiz da pasta `server/` (e configure nas plataformas de nuvem) com as seguintes chaves:

```env
# Configurações do Servidor
PORT=5000
NODE_ENV=development

# Banco de Dados MongoDB Atlas
MONGODB_URI=seu_link_de_conexao_do_mongodb_atlas

# Autenticação (JWT e Google OAuth)
JWT_SECRET=uma_chave_secreta_longa_e_segura
GOOGLE_CLIENT_ID=seu_client_id_do_google_auth

# Notificações de E-mail (Resend API)
RESEND_API_KEY=sua_chave_api_do_resend

# Configurações de Busca de Voos
FLIGHT_PROVIDER=googleflights
SERPAPI_KEY=sua_chave_api_do_serpapi

# Integração GitHub Actions para Scraper em Nuvem
GITHUB_PAT=seu_personal_access_token_do_github
GITHUB_REPO=seu_usuario/seu-repositorio
RUN_SCRAPER_LOCALLY=false # Defina true para forçar o scraper a rodar localmente no dev
```

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
*   Node.js (versão 18 ou superior) instalado.
*   MongoDB instalado localmente ou uma conta no MongoDB Atlas.

### Passo 1: Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/fly2gether.git
cd fly2gether
```

### Passo 2: Configurar e Rodar o Backend
1. Navegue para a pasta `server`:
   ```bash
   cd server
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie e preencha o arquivo `.env` baseado nas instruções acima.
4. Inicie o servidor em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
   *(O servidor rodará por padrão na porta `5000`)*.

### Passo 3: Configurar e Rodar o Frontend
1. Abra um novo terminal e navegue para a pasta `client`:
   ```bash
   cd ../client
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento do Vite:
   ```bash
   npm run dev
   ```
4. Abra o endereço indicado no seu navegador (geralmente `http://localhost:5173`).

---

## ☁️ Como Configurar em Produção

### 1. Hospedagem do Backend & Frontend (Vercel)
1. Importe o projeto no painel da **Vercel**.
2. Configure as variáveis de ambiente indicadas no painel da Vercel.
3. A Vercel utilizará o arquivo `vercel.json` da raiz para rotear e servir tanto a API quanto as rotas do frontend React.

### 2. Automação do Scraper (GitHub Actions)
O arquivo de configuração do robô já está estruturado em `.github/workflows/scrape-flights.yml`. Ele está programado para rodar de forma agendada todos os dias às **3:00 AM BRT** (`0 6 * * *` UTC) ou sob demanda.

Para que funcione:
1. Vá até as **Settings** do seu repositório no GitHub.
2. Acesse **Secrets and variables** -> **Actions**.
3. Adicione o seguinte repositório secreto (**Repository Secret**):
   *   `MONGO_URI`: A string de conexão do seu banco de dados MongoDB Atlas.
4. Certifique-se de ter configurado o `GITHUB_PAT` e `GITHUB_REPO` nas variáveis de ambiente da Vercel para que a API consiga acionar as execuções.
5. No painel do MongoDB Atlas, garanta que a aba **Network Access** possua liberação de IPs para todos (`0.0.0.0/0`), pois o GitHub Actions opera em IPs públicos dinâmicos.

---

## 📝 Licença

Este projeto está sob a licença [MIT](LICENSE).
