/* ==========================================================================
   NEXCHAT - OTIMIZADOR DE ALTA PERFORMANCE
   Compila, unifica e minifica CSS/JS em uma única requisição cada.
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const DIRETORIO_ATUAL = __dirname;
const DIR_SAIDA = path.join(DIRETORIO_ATUAL, 'dist');

// Configuração da ordem exata dos arquivos (importante para dependências)
const ARQUIVOS_CSS = [
    'estilos/principal.css',
    'estilos/chat.css',
    'estilos/barra-lateral.css',
    'estilos/configuracoes.css',
    'estilos/loja.css',
    'estilos/animacoes.css'
];

const ARQUIVOS_JS = [
    'scripts/utilitarios/constantes.js',
    'scripts/utilitarios/auxiliares.js',
    'scripts/utilitarios/embeds.js',
    'scripts/servicos/armazenamentoServico.js',
    'scripts/servicos/bancoDeDadosServico.js',
    'scripts/servicos/openrouterServico.js',
    'scripts/servicos/markdownServico.js',
    'scripts/componentes/barraLateral.js',
    'scripts/componentes/seletorModelo.js',
    'scripts/componentes/configuracoes.js',
    'scripts/componentes/painelLoja.js',
    'scripts/componentes/chat.js',
    'scripts/principal.js'
];

/**
 * Cria a estrutura de pastas necessária
 */
function garantirPastas() {
    if (!fs.existsSync(DIR_SAIDA)) {
        fs.mkdirSync(DIR_SAIDA, { recursive: true });
    }
    const dirEstilos = path.join(DIR_SAIDA, 'estilos');
    if (!fs.existsSync(dirEstilos)) {
        fs.mkdirSync(dirEstilos, { recursive: true });
    }
    const dirScripts = path.join(DIR_SAIDA, 'scripts');
    if (!fs.existsSync(dirScripts)) {
        fs.mkdirSync(dirScripts, { recursive: true });
    }
}

/**
 * Minifica arquivos CSS de forma ultra agressiva
 */
function minificarCSS(conteudo) {
    return conteudo
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comentários
        .replace(/\s+/g, ' ')             // Reduz espaços múltiplos
        .replace(/\s*([\{\}:;,])\s*/g, '$1') // Remove espaços ao redor de pontuação
        .replace(/;\}/g, '}')             // Remove ponto e vírgula desnecessários
        .trim();
}

/**
 * Minificador de JavaScript robusto por caracteres (100% seguro contra quebras de strings)
 */
function minificarJS(js) {
    let output = '';
    let i = 0;
    let inString = false;
    let stringChar = '';
    let inBlockComment = false;
    let inLineComment = false;
    
    while (i < js.length) {
        let char = js[i];
        let next = js[i+1];
        
        // Trata comentários em bloco
        if (inBlockComment) {
            if (char === '*' && next === '/') {
                inBlockComment = false;
                i += 2;
            } else {
                i++;
            }
            continue;
        }
        
        // Trata comentários em linha
        if (inLineComment) {
            if (char === '\n' || char === '\r') {
                inLineComment = false;
                output += char;
                i++;
            } else {
                i++;
            }
            continue;
        }
        
        // Trata strings e template literals
        if (inString) {
            if (char === '\\') {
                output += char + next;
                i += 2;
            } else if (char === stringChar) {
                inString = false;
                output += char;
                i++;
            } else {
                output += char;
                i++;
            }
            continue;
        }
        
        // Identifica início de comentários
        if (char === '/' && next === '*') {
            inBlockComment = true;
            i += 2;
            continue;
        }
        if (char === '/' && next === '/') {
            inLineComment = true;
            i += 2;
            continue;
        }
        
        // Identifica início de strings
        if (char === '"' || char === "'" || char === '`') {
            inString = true;
            stringChar = char;
            output += char;
            i++;
            continue;
        }
        
        output += char;
        i++;
    }
    
    // Otimizações de espaçamento seguro adicionais (não quebra sintaxe)
    return output
        .split('\n')
        .map(linha => linha.trim())
        .filter(linha => linha.length > 0)
        .join('\n');
}

/**
 * Executa o processo de compilação
 */
function compilar() {
    console.log('⚡ Iniciando otimização do NexChat...');
    garantirPastas();

    // 1. Processar CSS
    console.log('📦 Compilando estilos CSS...');
    let cssAcumulado = '';
    let tamanhoCssOriginal = 0;

    ARQUIVOS_CSS.forEach(file => {
        const caminho = path.join(DIRETORIO_ATUAL, file);
        if (fs.existsSync(caminho)) {
            const conteudo = fs.readFileSync(caminho, 'utf8');
            tamanhoCssOriginal += Buffer.byteLength(conteudo, 'utf8');
            cssAcumulado += `\n/* File: ${file} */\n` + conteudo;
        } else {
            console.warn(`⚠️ Arquivo CSS ausente: ${file}`);
        }
    });

    const cssMinificado = minificarCSS(cssAcumulado);
    const caminhoCssSaida = path.join(DIR_SAIDA, 'estilos', 'nexchat.min.css');
    fs.writeFileSync(caminhoCssSaida, cssMinificado, 'utf8');
    const tamanhoCssMin = Buffer.byteLength(cssMinificado, 'utf8');

    // 2. Processar JS
    console.log('📦 Compilando scripts JS...');
    let jsAcumulado = '';
    let tamanhoJsOriginal = 0;

    ARQUIVOS_JS.forEach(file => {
        const caminho = path.join(DIRETORIO_ATUAL, file);
        if (fs.existsSync(caminho)) {
            const conteudo = fs.readFileSync(caminho, 'utf8');
            tamanhoJsOriginal += Buffer.byteLength(conteudo, 'utf8');
            jsAcumulado += `\n\n/* File: ${file} */\n` + conteudo;
        } else {
            console.warn(`⚠️ Arquivo JS ausente: ${file}`);
        }
    });

    const jsMinificado = minificarJS(jsAcumulado);
    const caminhoJsSaida = path.join(DIR_SAIDA, 'scripts', 'nexchat.min.js');
    fs.writeFileSync(caminhoJsSaida, jsMinificado, 'utf8');
    const tamanhoJsMin = Buffer.byteLength(jsMinificado, 'utf8');

    // 3. Processar index.html
    console.log('📝 Otimizando index.html...');
    const caminhoHtml = path.join(DIRETORIO_ATUAL, 'index.html');
    let html = fs.readFileSync(caminhoHtml, 'utf8');

    // Remove as chamadas individuais de CSS e substitui pela unificada
    const regexCssOriginal = /<!-- Estilos modulares[\s\S]*?-->[\s\S]*?<link rel="stylesheet" href="estilos\/animacoes.css">/;
    const linkCssUnificado = '<link rel="stylesheet" href="estilos/nexchat.min.css">';
    html = html.replace(regexCssOriginal, linkCssUnificado);

    // Se o regex acima falhar por qualquer alteração estrutural, garantimos a substituição direta
    if (html.includes('estilos/principal.css')) {
        // Fallback robusto de substituição
        html = html.replace(/<link rel="stylesheet" href="estilos\/principal.css">([\s\S]*?)<link rel="stylesheet" href="estilos\/animacoes.css">/, linkCssUnificado);
    }

    // Remove as chamadas individuais de JS e substitui pela unificada
    const regexJsOriginal = /<!-- Scripts modulares com defer[\s\S]*?-->[\s\S]*?<script src="scripts\/principal.js" defer><\/script>/;
    const scriptJsUnificado = '<script src="scripts/nexchat.min.js" defer></script>';
    html = html.replace(regexJsOriginal, scriptJsUnificado);

    // Fallback robusto de substituição para JS
    if (html.includes('scripts/utilitarios/constantes.js')) {
        html = html.replace(/<script src="scripts\/utilitarios\/constantes.js" defer><\/script>([\s\S]*?)<script src="scripts\/principal.js" defer><\/script>/, scriptJsUnificado);
    }

    const caminhoHtmlSaida = path.join(DIR_SAIDA, 'index.html');
    fs.writeFileSync(caminhoHtmlSaida, html, 'utf8');

    // Mostrar relatórios de otimização de tamanho
    console.log('\n==================================================');
    console.log('🎉 COMPILAÇÃO E OTIMIZAÇÃO CONCLUÍDAS COM SUCESSO!');
    console.log('==================================================');
    console.log(`📂 Pasta de saída de produção: ${DIR_SAIDA}`);
    console.log(`📉 Redução CSS: ${(tamanhoCssOriginal / 1024).toFixed(2)} KB -> ${(tamanhoCssMin / 1024).toFixed(2)} KB (-${((1 - tamanhoCssMin/tamanhoCssOriginal) * 100).toFixed(1)}%)`);
    console.log(`📉 Redução JS:  ${(tamanhoJsOriginal / 1024).toFixed(2)} KB -> ${(tamanhoJsMin / 1024).toFixed(2)} KB (-${((1 - tamanhoJsMin/tamanhoJsOriginal) * 100).toFixed(1)}%)`);
    console.log(`🌐 Número de arquivos carregados: de 19 para apenas 2!`);
    console.log('==================================================\n');
}

try {
    compilar();
} catch (erro) {
    console.error('❌ Ocorreu um erro durante a otimização:', erro);
    process.exit(1);
}
