# Dra. Viviane Verônica

Site institucional da **Dra. Viviane Verônica Fernandes de Freitas**, angiologista e cirurgiã vascular em Uberlândia (MG).

Site estático (HTML/CSS/JS), pronto para hospedagem. CTAs via WhatsApp. Conteúdo baseado em fontes públicas (UMC, Doctoralia · CRM/MG 48087 · RQE 28650).

## Páginas

| Arquivo | Uso |
|---------|-----|
| `index.html` | Landing principal |
| `privacidade.html` | Política de Privacidade (LGPD) |
| `404.html` | Página de erro personalizada |

## Como rodar localmente

```bash
python -m http.server 8765
```

Abra: http://localhost:8765

## Publicar (entrega)

Opções comuns:

1. **Netlify / Vercel / Cloudflare Pages**  
   Conecte este repositório e publique a pasta raiz (sem build).

2. **GitHub Pages**  
   Settings → Pages → Branch `main` → pasta `/` (root).

3. **Hospedagem do cliente**  
   Envie os arquivos da raiz (exceto `node_modules`, `_archive`, `.git`).

## Domínio e SEO

Placeholder atual: `https://dravivianeveronica.com.br`

Quando o domínio real estiver pronto, substitua em:

- `index.html`, `privacidade.html`, `404.html` (canonical, Open Graph, Twitter, JSON-LD)
- `robots.txt`, `sitemap.xml`
- `config.js` (`siteUrl`)
- `site.webmanifest`

Busque por `PLACEHOLDER_SITE_URL` e `dravivianeveronica.com.br`.

## Analytics e Search Console

Em `config.js`, preencha antes do go-live:

- `gaMeasurementId` → ID do GA4 (`G-XXXXXXXXXX`)
- `gscVerification` → código da meta do Google Search Console

## Contato do consultório

- WhatsApp: [(34) 99266-5656](https://wa.me/5534992665656)
- Instagram: [@dravivianeveronica](https://www.instagram.com/dravivianeveronica/)
- UMC: Rua Rafael Marino Neto, 600, Portaria, 2º andar, Recepção 2, Jardim Karaíba, Uberlândia/MG

## Screenshots (opcional, desenvolvimento)

```bash
npm install
python -m http.server 8765
npm run shots
```

Os `.png` não entram no Git. Inventário em `screenshots/index.json`.
