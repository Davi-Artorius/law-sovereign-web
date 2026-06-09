const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const MOCKUPS_DIR = '/home/mimir/Projetos/law-sovereign-web/public/mockups';

(async () => {
  let browser;
  try {
    console.log('🚀 Iniciando Puppeteer...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    page.setViewport({ width: 1440, height: 900 });

    // ─── LOGIN ───────────────────────────────────────────────────────
    console.log('🔐 Navegando para localhost:5173...');
    try {
      await page.goto('http://localhost:5173', { waitUntil: 'domContentLoaded', timeout: 15000 });
    } catch (e) {
      console.log('⚠️ Timeout na navegação, continuando...');
    }

    // Aguarda input de email
    console.log('⏳ Aguardando formulário de login...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    console.log('📝 Preenchendo credenciais...');
    await page.type('input[type="email"]', 'daviambr2@gmail.com', { delay: 50 });
    await page.type('input[type="password"]', 'mopingulim132!', { delay: 50 });

    console.log('🔓 Clicando botão de login...');
    await page.click('button');

    // Aguarda redirecionamento para dashboard
    console.log('⏳ Aguardando redirecionamento...');
    await page.waitForNavigation({ timeout: 15000 }).catch(() => {
      console.log('⚠️ Navegação esperada não aconteceu');
    });

    await new Promise(r => setTimeout(r, 2000)); // Aguarda render do dashboard
    console.log('✅ Login realizado');

    // ─── DASHBOARD ───────────────────────────────────────────────────
    console.log('📸 Capturando Dashboard...');
    await page.screenshot({
      path: path.join(MOCKUPS_DIR, 'dashboard.png'),
      fullPage: false
    });
    console.log('✅ Dashboard capturado: ' + path.join(MOCKUPS_DIR, 'dashboard.png'));

    // ─── TRIAGEM ─────────────────────────────────────────────────────
    console.log('📸 Acessando página de Triagem...');

    // Procura pelo botão de Triagem na sidebar
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const triagem = buttons.find(b => b.textContent.includes('Triagem'));
      if (triagem) {
        console.log('Encontrado botão Triagem, clicando...');
        triagem.click();
      } else {
        console.log('Botão Triagem não encontrado');
      }
    });

    // Aguarda carregamento da página de triagem
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({
      path: path.join(MOCKUPS_DIR, 'triagem.png'),
      fullPage: false
    });
    console.log('✅ Triagem capturada: ' + path.join(MOCKUPS_DIR, 'triagem.png'));

    console.log('\n🎉 Screenshots atualizados com sucesso!');
    await browser.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
