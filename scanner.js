(function(){
  'use strict';

  // Injeta estilos para os avisos de log e layout das linhas
  (function injectStyles() {
    var style = document.createElement('style');
    style.innerHTML = 
      '.cat-item-log-wrapper { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }' +
      '.log-warning { font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; white-space: nowrap; flex-shrink: 0; margin-bottom: 2px; }' +
      '.log-warning.oldest { background: #2a2a2a; color: #999; border: 1px solid #444; }' +
      '.log-warning.newest { background: #8b0000; color: #eee; border: 1px solid #a52a2a; box-shadow: 0 0 4px rgba(139,0,0,0.2); }' +
      '.cat-item-install.uninstall { background: rgba(255,255,255,0.05); border-color: #444; color: #aaa; }' +
      '.cat-item-log { font-family: "IBM Plex Mono", monospace; font-size: 11px; color: #eee; word-break: break-all; line-height: 1.4; background: rgba(255,255,255,0.05); padding: 2px 4px; border-radius: 2px; flex: 1; min-width: 200px; }' +
      '.log-highlight { background: #ffea00; color: #000; padding: 0 2px; border-radius: 2px; font-weight: bold; }';
    document.head.appendChild(style);
  })();

  // ============ NAVEGAÇÃO (sem login — só landing -> scanner) ============
  function enterScanner() {
    var landing = document.getElementById('landingScreen');
    landing.style.opacity = '0';
    landing.style.transition = 'opacity 0.3s';
    setTimeout(function(){ landing.style.display = 'none'; }, 300);
    document.getElementById('mainWrap').classList.add('unlocked');
    startMatrixRain();
  }

  var enterBtn = document.getElementById('enterScannerBtn');
  if (enterBtn) enterBtn.addEventListener('click', enterScanner);

  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', function() { location.reload(); });

  // ============ CHUVA DE CÓDIGO BINÁRIO (canvas de fundo, sutil) ============
  var matrixStarted = false;
  function startMatrixRain() {
    if (matrixStarted) return;
    matrixStarted = true;

    var canvas = document.getElementById('matrixRain');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var fontSize = 9; // pequeno, como pedido
    var columns, drops;
    var frameSkip = 4; // só avança a cada N frames = bem devagar
    var frameCounter = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.ceil(canvas.width / fontSize);
      drops = [];
      for (var i = 0; i < columns; i++) drops[i] = Math.random() * -100;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      frameCounter++;
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (frameCounter % frameSkip === 0) {
        ctx.font = fontSize + 'px "IBM Plex Mono", monospace';
        for (var i = 0; i < columns; i++) {
          var char = Math.random() > 0.5 ? '1' : '0';
          var x = i * fontSize;
          var y = drops[i] * fontSize;
          var isHead = Math.random() > 0.93;
          ctx.fillStyle = isHead ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.32)';
          ctx.fillText(char, x, y);
          if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
          drops[i]++;
        }
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // ============ BASE DE PACOTES CONHECIDOS (Android) ============
  // Cada entrada: categoria, rótulo amigável e nome real do pacote Android.
  var PACKAGE_DB = [
    // Aplicativo Disfarçado (proxy escondido atrás de um app/marca conhecida)
    { group: 'Aplicativo Disfarçado', label: 'Nubank Falso',        pkg: 'com.nu.roxinho' },
    { group: 'Aplicativo Disfarçado', label: 'Proxy Disfarçado de Netflix', pkg: 'com.netflix.mediaclientxx' },
    { group: 'Aplicativo Disfarçado', label: 'Spotify Proxy',       pkg: 'com.spotify.musicx' },
    { group: 'Aplicativo Disfarçado', label: "Proxy Disfarçado de McDonald's", pkg: 'com.mcdo.mcdonaldss' },
    { group: 'Aplicativo Disfarçado', label: 'Proxy Fitcal',        pkg: 'com.lucasqueiroz.fitcal' },
    { group: 'Aplicativo Disfarçado', label: 'Proxy Caixa',         pkg: 'com.sylvaz.app' },
    { group: 'Aplicativo Disfarçado', label: 'Proxy PayPal',        pkg: 'com.my.newproject7' },
    { group: 'Aplicativo Disfarçado', label: 'Proxy Shopee',        pkg: 'com.mycompany.myapp' },
    { group: 'Aplicativo Disfarçado', label: 'Proxy Snow',          pkg: 'com.android.system.service.optimizer' },
    { group: 'Aplicativo Disfarçado', label: 'Proxy MthTeam',       pkg: 'com.pornhub' },
    { group: 'Aplicativo Disfarçado', label: 'Minha Claro MthTeam', pkg: 'com.nvt.cc' },
    { group: 'Aplicativo Disfarçado', label: 'Proxy Google',        pkg: 'com.android.sellestw' },
    { group: 'Aplicativo Disfarçado', label: 'Proxy Inter',         pkg: 'br.com.intermediumx' },
    // Proxy Externo (ferramenta de proxy avulsa, sem se passar por outro app)
    { group: 'Proxy Externo', label: 'Proxy Free',      pkg: 'com.proxy.free' },
    { group: 'Proxy Externo', label: 'Drip Proxy',      pkg: 'com.dripclient.proxy' },
    { group: 'Proxy Externo', label: 'Proxy Aincrad',   pkg: 'com.aincrad.proxy' },
    { group: 'Proxy Externo', label: 'Proxy External',  pkg: 'client.by' },
    { group: 'Proxy Externo', label: 'Gringo Proxy',    pkg: 'io.gringoxp.proxy.garena.freefire' },
    { group: 'Proxy Externo', label: 'Proxy Hg Cheats', pkg: 'com.proxyall' },
    { group: 'Proxy Externo', label: 'Proxy Cashxiter', pkg: 'com.c4dev.ofc' },
    { group: 'Proxy Externo', label: 'Proxy chatgpt', pkg: 'com.openai.chatgptx' },
    // Suspeita (ferramentas de acesso/modificação, não são proxy em si)
    { group: 'Suspeita', label: 'Testador de detecção de root (Reveny)', pkg: 'com.reveny.nativecheck' },
    { group: 'Suspeita', label: 'Ferramenta de acesso: Termux',          pkg: 'com.termux' },
    { group: 'Suspeita', label: 'Ferramenta de acesso: MT Manager',      pkg: 'bin.mt.plus' },
    { group: 'Suspeita', label: 'Ferramenta de acesso: Zarchiver', pkg: 'ru.zdevs.zarchiver' },
    { group: 'Suspeita', label: 'Ferramenta de acesso: Brevent', pkg: 'me.piebridge.brevent' },
    // Rastros de Root
    { group: 'Rastros de Root', label: 'Magisk Delta', pkg: 'io.github.huskydg.magisk' },
    { group: 'Rastros de Root', label: 'APatch (root via kernel)', pkg: 'me.bmax.apatch' },
    { group: 'Rastros de Root', label: 'Zygisk (módulo Magisk)', pkg: 'zygisk', exclude: /duckdetector|zygisk_fd_detector|zygisk.detector/i },
    { group: 'Rastros de Root', label: 'VBMeta Fix (bypass de Verified Boot)', pkg: 'vbmetafix' },
    { group: 'Rastros de Root', label: 'Shizuku (acesso privilegiado)', pkg: 'moe.shizuku.privileged.api' }
  ];

  // ============ BASE DE PERFIS/CERTIFICADOS SUSPEITOS (iOS) ============
  // match: 'prefix' -> identificador começa com value (case-insensitive)
  // match: 'exact'  -> identificador contém value (case-insensitive)
  var IOS_PACKAGE_DB = [
    // Zeex Free/VIP
    { category: 'Zeex Free/VIP', match: 'prefix', value: '78f' },
    { category: 'Zeex Free/VIP', match: 'prefix', value: 'd14' },
    { category: 'Zeex Free/VIP', match: 'prefix', value: '140' },
    { category: 'Zeex Free/VIP', match: 'prefix', value: '06' },
    // Fatality Bypass
    { category: 'Fatality Bypass', match: 'prefix', value: '1ea' },
    { category: 'Fatality Bypass', match: 'prefix', value: 'b0' },
    { category: 'Fatality Bypass', match: 'prefix', value: '2c' },
    { category: 'Fatality Bypass', match: 'prefix', value: '9d' },
    // Luxe Cheats (Nova ATT)
    { category: 'Luxe Cheats (Nova ATT)', match: 'prefix', value: 'b9' },
    { category: 'Luxe Cheats (Nova ATT)', match: 'prefix', value: 'a4' },
    // XTREMO
    { category: 'XTREMO', match: 'exact', value: 'com.xtremo.mobile' },
    // Dash
    { category: 'Dash', match: 'prefix', value: '60a' },
    { category: 'Dash', match: 'prefix', value: '70a' },
    { category: 'Dash', match: 'exact', value: 'dash.proxy' },
    // Work
    { category: 'Work', match: 'prefix', value: 'd03090' },
    // Community Guest
    { category: 'Community Guest', match: 'prefix', value: '439' },
    // Nova Casa de Aposta Disfarçada
    { category: 'Nova Casa de Aposta Disfarçada', match: 'prefix', value: '704114' },
    // Certificado Externo
    { category: 'Certificado Externo', match: 'exact', value: 'iMac.EFB7D714' },
    { category: 'Certificado Externo', match: 'exact', value: 'to.appdb.certs1' },
    { category: 'Certificado Externo', match: 'exact', value: 'to.appdb.certs2' },
    { category: 'Certificado Externo', match: 'exact', value: 'to.appdb.C2D9F2' },
    // Desconhecida (prefixos hex)
    { category: 'Desconhecida', match: 'prefix', value: '03' },
    { category: 'Desconhecida', match: 'prefix', value: '06a' },
    { category: 'Desconhecida', match: 'prefix', value: '0af' },
    { category: 'Desconhecida', match: 'prefix', value: '0b' },
    { category: 'Desconhecida', match: 'prefix', value: '0e' },
    { category: 'Desconhecida', match: 'prefix', value: '14' },
    { category: 'Desconhecida', match: 'prefix', value: '15d' },
    { category: 'Desconhecida', match: 'prefix', value: '28a' },
    { category: 'Desconhecida', match: 'prefix', value: '3c' },
    { category: 'Desconhecida', match: 'prefix', value: '3c4' },
    { category: 'Desconhecida', match: 'prefix', value: '4a' },
    { category: 'Desconhecida', match: 'prefix', value: '4cf' },
    { category: 'Desconhecida', match: 'prefix', value: '4d' },
    { category: 'Desconhecida', match: 'prefix', value: '4e' },
    { category: 'Desconhecida', match: 'prefix', value: '47' },
    { category: 'Desconhecida', match: 'prefix', value: '51' },
    { category: 'Desconhecida', match: 'prefix', value: '59ac' },
    { category: 'Desconhecida', match: 'prefix', value: '60af' },
    { category: 'Desconhecida', match: 'prefix', value: '62' },
    { category: 'Desconhecida', match: 'prefix', value: '62d' },
    { category: 'Desconhecida', match: 'prefix', value: '69' },
    { category: 'Desconhecida', match: 'prefix', value: '6b' },
    { category: 'Desconhecida', match: 'prefix', value: '6dd' },
    { category: 'Desconhecida', match: 'prefix', value: '70d' },
    { category: 'Desconhecida', match: 'prefix', value: '704' },
    { category: 'Desconhecida', match: 'prefix', value: '739' },
    { category: 'Desconhecida', match: 'prefix', value: '76d' },
    { category: 'Desconhecida', match: 'prefix', value: '7d' },
    { category: 'Desconhecida', match: 'prefix', value: '80' },
    { category: 'Desconhecida', match: 'prefix', value: '84' },
    { category: 'Desconhecida', match: 'prefix', value: '90eb' },
    { category: 'Desconhecida', match: 'prefix', value: '96f' },
    { category: 'Desconhecida', match: 'prefix', value: 'b4' },
    { category: 'Desconhecida', match: 'prefix', value: 'bc' },
    { category: 'Desconhecida', match: 'prefix', value: 'c9' },
    { category: 'Desconhecida', match: 'prefix', value: 'd5' },
    { category: 'Desconhecida', match: 'prefix', value: 'd7319' },
    { category: 'Desconhecida', match: 'prefix', value: 'e0' },
    { category: 'Desconhecida', match: 'prefix', value: 'e3' },
    { category: 'Desconhecida', match: 'prefix', value: 'f9' },
    { category: 'Desconhecida', match: 'prefix', value: 'ae7' },
    { category: 'Desconhecida', match: 'prefix', value: 'a4c' },
    { category: 'Desconhecida', match: 'prefix', value: 'a5' },
    { category: 'Desconhecida', match: 'prefix', value: 'a9' },
    { category: 'Desconhecida', match: 'prefix', value: 'a48' },
    { category: 'Desconhecida', match: 'prefix', value: 'a64' },
    { category: 'Desconhecida', match: 'prefix', value: 'bd' },
    { category: 'Desconhecida', match: 'prefix', value: 'bd32' },
    { category: 'Desconhecida', match: 'prefix', value: 'c17' },
    { category: 'Desconhecida', match: 'prefix', value: 'c25' },
    { category: 'Desconhecida', match: 'prefix', value: 'd03' },
    { category: 'Desconhecida', match: 'prefix', value: 'd4f0' },
    { category: 'Desconhecida', match: 'prefix', value: 'f6' },
    { category: 'Desconhecida', match: 'prefix', value: 'f6c' },
    { category: 'Desconhecida', match: 'prefix', value: 'f54' },
    { category: 'Desconhecida', match: 'prefix', value: 'ff6' },
    { category: 'Desconhecida', match: 'prefix', value: 'ff32' },
    { category: 'Desconhecida', match: 'prefix', value: '2bb' },
    // Desconhecida (identificadores nomeados)
    { category: 'Desconhecida', match: 'exact', value: 'XITADO' },
    { category: 'Desconhecida', match: 'exact', value: 'Regedit' },
    { category: 'Desconhecida', match: 'exact', value: 'Khoindvn' },
    { category: 'Desconhecida', match: 'exact', value: 'vip.unc0ver' },
    { category: 'Desconhecida', match: 'exact', value: 'com.luxebypass' },
    { category: 'Desconhecida', match: 'exact', value: 'com.thanhcongregedit' },
    { category: 'Desconhecida', match: 'exact', value: 'authproxyxff.up' },
    { category: 'Desconhecida', match: 'exact', value: 'freefireproxy.xyz' },
    { category: 'Desconhecida', match: 'exact', value: 'proxyady' },
    { category: 'Desconhecida', match: 'prefix', value: 'mit' },
    // Sideload/Jailbreak (Filza, ESign, TrollStore) — IDs confirmados em evidência real de sysdiagnose
    { category: 'Sideload/Jailbreak', match: 'exact', value: 'com.tigisoftware.filza' },
    { category: 'Sideload/Jailbreak', match: 'exact', value: 'filza' },
    { category: 'Sideload/Jailbreak', match: 'exact', value: 'vn.esign.app11' },
    { category: 'Sideload/Jailbreak', match: 'exact', value: 'esign' },
    { category: 'Sideload/Jailbreak', match: 'exact', value: 'com.alfie.trollinstallerx' },
    { category: 'Sideload/Jailbreak', match: 'exact', value: 'trollstore' },
    { category: 'Sideload/Jailbreak', match: 'exact', value: 'trollinstaller' },
  ];

  // ============ ELEMENTOS ============
  var dropEl = document.getElementById('drop');
  var fileInput = document.getElementById('file');
  var progressWrap = document.getElementById('progressWrap');
  var idleStatus = document.getElementById('idleStatus');
  var progressFill = document.getElementById('progressFill');
  var progressLabel = document.getElementById('progressLabel');
  var errEl = document.getElementById('err');
  var resultsEl = document.getElementById('results');
  var verdictDot = document.getElementById('verdictDot');
  var verdictTitle = document.getElementById('verdictTitle');
  var verdictDesc = document.getElementById('verdictDesc');
  var fileInfoBar = document.getElementById('fileInfoBar');
  var verifiedBootHero = document.getElementById('verifiedBootHero');
  var vbhIcon = document.getElementById('vbhIcon');
  var vbhValue = document.getElementById('vbhValue');
  var vbhDesc = document.getElementById('vbhDesc');
  var categoryCardsEl = document.getElementById('categoryCards');
  var androidPanel = document.getElementById('androidPanel');
  var appIdCard = document.getElementById('appIdCard');
  var appIdBox = document.getElementById('appIdBox');
  var appIdTitle = document.getElementById('appIdTitle');
  var appIdDetail = document.getElementById('appIdDetail');
  var andModel = document.getElementById('andModel');
  var andManufacturer = document.getElementById('andManufacturer');
  var andBrand = document.getElementById('andBrand');
  var andVersion = document.getElementById('andVersion');
  var andSdk = document.getElementById('andSdk');
  var andBuildId = document.getElementById('andBuildId');
  var andBuildType = document.getElementById('andBuildType');
  var andFingerprint = document.getElementById('andFingerprint');
  var andSerial = document.getElementById('andSerial');
  var stateList = document.getElementById('stateList');
  var iosPanel = document.getElementById('iosPanel');
  var iosDeviceName = document.getElementById('iosDeviceName');
  var iosSerial = document.getElementById('iosSerial');
  var iosVersion = document.getElementById('iosVersion');
  var iosBuild = document.getElementById('iosBuild');
  var iosProduct = document.getElementById('iosProduct');
  var iosSysImage = document.getElementById('iosSysImage');
  var iosAppsCount = document.getElementById('iosAppsCount');
  var iosAlertCount = document.getElementById('iosAlertCount');
  var iosProfileCount = document.getElementById('iosProfileCount');
  var iosSummary = document.getElementById('iosSummary');
  var iosEvents = document.getElementById('iosEvents');
  var resetBtn = document.getElementById('resetBtn');
  var scanCountEl = document.getElementById('scanCount');

  // ============ CONTADOR DE USOS GLOBAL (via CountAPI — soma o uso de todos os visitantes) ============
  // Serviço público e gratuito, sem necessidade de login/token. A chave abaixo só precisa ser única
  // pra não colidir com o contador de outro site — pode trocar se quiser isolar ainda mais.
  var COUNTER_BASE = 'https://countapi.mileshilliard.com/api/v1';
  var COUNTER_KEY = 'kernelbypass_scanner_hazzscreens_v1';

  var scanCountMemoryFallback = 0; // usado só se a API do contador estiver fora do ar/sem internet

  (function initScanCount() {
    fetch(COUNTER_BASE + '/get/' + COUNTER_KEY)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && typeof data.value === 'number') {
          scanCountMemoryFallback = data.value;
          if (scanCountEl) scanCountEl.textContent = data.value;
        }
      })
      .catch(function() { /* API fora do ar: mantém o número estático que já está no HTML */ });
  })();

  function incrementScanCount() {
    fetch(COUNTER_BASE + '/hit/' + COUNTER_KEY)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && typeof data.value === 'number') {
          scanCountMemoryFallback = data.value;
          if (scanCountEl) scanCountEl.textContent = data.value;
        }
      })
      .catch(function() {
        // Sem conexão com o contador global agora: incrementa só visualmente pra não travar a experiência
        scanCountMemoryFallback++;
        if (scanCountEl) scanCountEl.textContent = scanCountMemoryFallback;
      });
  }

  // (o toggle de colapsar/expandir agora é por categoria, montado dinamicamente em renderCategoryCards)

  function showError(msg) {
    errEl.textContent = msg;
    errEl.style.display = 'block';
  }
  function clearError() {
    errEl.style.display = 'none';
    errEl.textContent = '';
  }
  function setProgress(pct, label) {
    idleStatus.style.display = 'none';
    progressWrap.style.display = 'block';
    progressFill.style.width = pct + '%';
    progressLabel.textContent = label || (pct + '%');
  }
  function resetUI() {
    clearError();
    progressWrap.style.display = 'none';
    setProgress(0, '0%');
    idleStatus.style.display = 'flex';
    resultsEl.style.display = 'none';
    categoryCardsEl.innerHTML = '';
    androidPanel.style.display = 'none';
    iosEvents.innerHTML = '';
    iosPanel.style.display = 'none';
    fileInput.value = '';
    if (folderInput) folderInput.value = '';
    dropEl.style.display = 'block';
  }

  // ============ ABRIR SELETOR DE ARQUIVO AO CLICAR NA DROPZONE ============
  dropEl.addEventListener('click', function(e) {
    // Evita abrir 2x se o clique já veio do próprio <input>
    if (e.target === fileInput) return;
    fileInput.click();
  });

  // ============ DRAG & DROP ============
  ['dragenter', 'dragover'].forEach(function(evt) {
    dropEl.addEventListener(evt, function(e) {
      e.preventDefault();
      e.stopPropagation();
      dropEl.classList.add('drag');
    });
  });
  ['dragleave', 'dragend'].forEach(function(evt) {
    dropEl.addEventListener(evt, function(e) {
      e.preventDefault();
      e.stopPropagation();
      dropEl.classList.remove('drag');
    });
  });
  dropEl.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
    dropEl.classList.remove('drag');
    var files = e.dataTransfer.files;
    if (files && files.length) handleFile(files[0]);
  });
  // Impede que o navegador abra o arquivo se o usuário soltar fora da dropzone
  document.addEventListener('dragover', function(e) { e.preventDefault(); });
  document.addEventListener('drop', function(e) {
    if (e.target !== dropEl && !dropEl.contains(e.target)) e.preventDefault();
  });

  fileInput.addEventListener('change', function() {
    if (fileInput.files && fileInput.files.length) handleFile(fileInput.files[0]);
  });

  resetBtn.addEventListener('click', resetUI);

  // ============ UPLOAD DE PASTA JÁ EXTRAÍDA (evita descompactar tar.gz gigante no navegador) ============
  var folderBtn = document.getElementById('folderBtn');
  var folderInput = document.getElementById('folderInput');
  var FOLDER_FILE_SIZE_CAP = 15 * 1024 * 1024; // arquivos individuais acima disso são ignorados (proteção extra)

  if (folderBtn && folderInput) {
    folderBtn.addEventListener('click', function() { folderInput.click(); });
    folderInput.addEventListener('change', function() {
      if (folderInput.files && folderInput.files.length) handleFolderFiles(folderInput.files);
    });
  }

  var currentFileInfo = null; // { name, size } — usado na barra "Arquivo: ... | Tamanho: ..."

  function handleFolderFiles(fileList) {
    clearError();
    resultsEl.style.display = 'none';
    dropEl.style.display = 'none';
    setProgress(15, 'Lendo pasta (' + fileList.length + ' arquivos)...');

    var fileMap = {};
    var paths = [];
    var totalSize = 0;
    var topName = fileList[0] && fileList[0].webkitRelativePath ? fileList[0].webkitRelativePath.split('/')[0] : 'pasta selecionada';
    for (var i = 0; i < fileList.length; i++) {
      var f = fileList[i];
      var rel = f.webkitRelativePath || f.name;
      fileMap[rel] = f;
      paths.push(rel);
      totalSize += f.size || 0;
    }
    currentFileInfo = { name: topName, size: totalSize };

    var archive = {
      paths: paths,
      read: function(path) {
        var f = fileMap[path];
        if (!f) return Promise.reject(new Error('arquivo não encontrado: ' + path));
        if (f.size > FOLDER_FILE_SIZE_CAP) return Promise.resolve(''); // ignora arquivos individuais grandes demais
        return f.text();
      }
    };

    processArchive(archive);
  }

  // ============ PROCESSAMENTO DO ARQUIVO ============
  function handleFile(file) {
    clearError();
    resultsEl.style.display = 'none';
    currentFileInfo = { name: file.name, size: file.size };

    var name = file.name.toLowerCase();
    var isTxt = name.endsWith('.txt');
    var isZip = name.endsWith('.zip');
    var isTarGz = name.endsWith('.tar.gz') || name.endsWith('.tgz');

    if (!isTxt && !isZip && !isTarGz) {
      showError('Formato inválido. Envie um arquivo .zip, .tar.gz/.tgz ou .txt.');
      return;
    }

    dropEl.style.display = 'none';
    setProgress(5, 'Lendo arquivo...');

    if (isTxt) {
      var reader = new FileReader();
      reader.onprogress = function(e) {
        if (e.lengthComputable) {
          var pct = Math.round((e.loaded / e.total) * 60) + 5;
          setProgress(pct, 'Lendo arquivo... ' + pct + '%');
        }
      };
      reader.onload = function() { analyzeFiles([{ path: file.name, content: reader.result }]); };
      reader.onerror = function() {
        showError('Não foi possível ler o arquivo.');
        dropEl.style.display = 'block';
      };
      reader.readAsText(file);
      return;
    }

    if (isZip) {
      if (typeof JSZip === 'undefined') {
        showError('Falha ao carregar biblioteca de leitura de .zip. Verifique sua conexão.');
        dropEl.style.display = 'block';
        return;
      }
      setProgress(10, 'Descompactando .zip...');
      JSZip.loadAsync(file).then(function(zip) {
        var allPaths = Object.keys(zip.files).filter(function(p) { return !zip.files[p].dir; });
        var archive = {
          paths: allPaths,
          read: function(path) { return zip.file(path).async('string'); }
        };
        processArchive(archive);
      }).catch(function() {
        showError('Arquivo .zip inválido ou corrompido.');
        dropEl.style.display = 'block';
      });
      return;
    }

    if (isTarGz) {
      if (typeof pako === 'undefined') {
        showError('Falha ao carregar biblioteca de leitura de .tar.gz. Verifique sua conexão.');
        dropEl.style.display = 'block';
        return;
      }
      setProgress(10, 'Descompactando .tar.gz...');
      var fr = new FileReader();
      fr.onload = function() {
        try {
          var gzBytes = new Uint8Array(fr.result);
          setProgress(25, 'Descomprimindo gzip...');
          var tarBytes = pako.ungzip(gzBytes);
          setProgress(45, 'Lendo arquivos do tar...');
          var tarEntries = parseTar(tarBytes);
          var fileMap = {};
          var decoder = new TextDecoder('utf-8', { fatal: false });
          tarEntries.forEach(function(entry) {
            if (!entry.dir) fileMap[entry.name] = entry.data;
          });
          var allPaths = Object.keys(fileMap);
          var archive = {
            paths: allPaths,
            read: function(path) {
              return Promise.resolve(decoder.decode(fileMap[path]));
            }
          };
          processArchive(archive);
        } catch (e) {
          showError('Arquivo .tar.gz inválido ou corrompido.');
          dropEl.style.display = 'block';
        }
      };
      fr.onerror = function() {
        showError('Não foi possível ler o arquivo.');
        dropEl.style.display = 'block';
      };
      fr.readAsArrayBuffer(file);
      return;
    }
  }

  // ============ PARSER DE TAR (usado após descompactar .tar.gz com pako) ============
  function parseTar(bytes) {
    var entries = [];
    var offset = 0;
    var longName = null;
    var decoder = new TextDecoder('utf-8', { fatal: false });

    function readString(off, len) {
      var slice = bytes.subarray(off, off + len);
      var end = slice.indexOf(0);
      if (end === -1) end = len;
      return decoder.decode(slice.subarray(0, end));
    }
    function readOctal(off, len) {
      var s = readString(off, len).trim();
      return s ? parseInt(s, 8) : 0;
    }
    function isZeroBlock(off) {
      for (var i = 0; i < 512; i++) { if (bytes[off + i] !== 0) return false; }
      return true;
    }

    while (offset + 512 <= bytes.length) {
      if (isZeroBlock(offset)) break;

      var name = readString(offset, 100);
      var prefix = readString(offset + 345, 155);
      var size = readOctal(offset + 124, 12);
      var typeflag = String.fromCharCode(bytes[offset + 156]);
      var fullName = prefix ? (prefix + '/' + name) : name;

      offset += 512;
      var dataStart = offset;
      var dataEnd = offset + size;

      if (typeflag === 'L') {
        // GNU tar: próxima entry tem o nome longo no conteúdo deste bloco
        longName = decoder.decode(bytes.subarray(dataStart, dataEnd)).replace(/\0+$/, '');
      } else {
        var entryName = longName || fullName;
        longName = null;
        if (typeflag === '5') {
          entries.push({ name: entryName, dir: true });
        } else if (typeflag === '0' || typeflag === '\0' || typeflag === '') {
          entries.push({ name: entryName, dir: false, data: bytes.subarray(dataStart, dataEnd) });
        }
      }
      offset += Math.ceil(size / 512) * 512;
    }
    return entries;
  }

  // ============ ROTEAMENTO: iOS x Android, independente da origem (zip/tar) ============
  function processArchive(archive) {
    var isIOS = archive.paths.some(function(p) {
      return /SystemVersion\.plist$/i.test(p) || /^sysdiagnose_/i.test(p) || /system_logs\.logarchive/i.test(p);
    });

    if (isIOS) {
      handleIOSArchive(archive);
      return;
    }

    var textPaths = archive.paths.filter(function(p) { return /\.(txt|xml|log)$/i.test(p); });
    if (!textPaths.length) {
      showError('Nenhum arquivo de texto encontrado dentro do arquivo enviado.');
      dropEl.style.display = 'block';
      return;
    }

    var fileContents = []; // [{ path, content }]
    var done = 0;
    textPaths.forEach(function(p) {
      archive.read(p).then(function(content) {
        fileContents.push({ path: p, content: content });
        done++;
        var pct = 10 + Math.round((done / textPaths.length) * 70);
        setProgress(pct, 'Analisando arquivos... ' + done + '/' + textPaths.length);
        if (done === textPaths.length) analyzeFiles(fileContents);
      }).catch(function() {
        done++;
        if (done === textPaths.length) analyzeFiles(fileContents);
      });
    });
  }

  // ============ SYSDIAGNOSE (iPhone) ============
  function handleIOSArchive(archive) {
    setProgress(20, 'Identificando dispositivo...');

    var sysVersionPath = archive.paths.find(function(p) { return /SystemVersion\.plist$/i.test(p); });
    var deviceInfoPromise = sysVersionPath ? archive.read(sysVersionPath) : Promise.resolve('');

    // Arquivos onde perfis/certificados/evidências aparecem — inclui .txt também, mas com cuidado:
    // muitos .txt de sysdiagnose são logs de crash/dump binário enormes, então a varredura de token
    // "solto" (que pega qualquer coisa, não só <key>) só roda em arquivos de evidência conhecidos.
    var plistPaths = archive.paths.filter(function(p) { 
      return /\.(plist|xml|txt|log|tracev3)$/i.test(p) || /EA4B5C24D5643E2699207B76F6C7F6FC$/i.test(p); 
    });

    // Whitelist de .txt onde já confirmamos formato de texto legível (não binário/hex dump).
    // Adicionar mais padrões aqui conforme formos confirmando outros arquivos.
    var TXT_TOKEN_SCAN_WHITELIST = [/brctl-container-list\.txt$/i, /brctl-.*\.txt$/i];
    function isSafeForTokenScan(path) {
      if (/\.(plist|xml)$/i.test(path)) return true; // estruturado, sem risco de lixo binário
      return TXT_TOKEN_SCAN_WHITELIST.some(function(re) { return re.test(path); });
    }

    deviceInfoPromise.then(function(plistText) {
      var productVersion = extractPlistValue(plistText, 'ProductVersion');
      var buildVersion = extractPlistValue(plistText, 'ProductBuildVersion');
      var productName = extractPlistValue(plistText, 'ProductName');

      iosDeviceName.textContent = productName || 'iPhone';
      iosVersion.textContent = productVersion || '-';
      iosBuild.textContent = buildVersion || '-';
      iosProduct.textContent = '-';
      iosSysImage.textContent = '-';
      iosSerial.textContent = '-';

      setProgress(35, 'Lendo perfis, certificados e histórico...');

      var allKeys = new Set();
      var keySources = {}; // chave -> [{ path, snippet }]
      var timelineEvents = [];
      var seenEvents = new Set();
      var done = 0;
      var total = plistPaths.length || 1;

      if (!plistPaths.length) {
        finishIOSScan(allKeys, timelineEvents, keySources);
        return;
      }

      plistPaths.forEach(function(p) {
        archive.read(p).then(function(txt) {
          var isMCState = /MCState\.log$/i.test(p);
          var isKBDebug = /kbdebug\.txt$/i.test(p);
          var isProxyInjectionFile = /EA4B5C24D5643E2699207B76F6C7F6FC$/i.test(p);
          var isTraceV3 = /\.tracev3$/i.test(p);

          // Detecção de Proxy Injection no arquivo específico
          if (isProxyInjectionFile) {
            var lines = txt.split(/\r?\n/);
            lines.forEach(function(line, index) {
              if (line.toLowerCase().indexOf('proxy injection') !== -1) {
                var key = "PROXY_INJECTION";
                if (!allKeys.has(key)) { allKeys.add(key); keySources[key] = []; }
                if (!keySources[key].some(function(s) { return s.snippet === line.trim(); })) {
                  keySources[key].push({ path: p, snippet: line.trim(), isProxyInjection: true, originalTerm: 'Proxy Injection', category: 'Proxy Externo' });
                }
              }
            });
            return;
          }

          // Detecção de Binary Bypass em arquivos .tracev3
          if (isTraceV3) {
            var lines = txt.split(/\r?\n/);
            lines.forEach(function(line, index) {
              if (line.toLowerCase().indexOf('binary bypass') !== -1) {
                var key = "BINARY_BYPASS";
                if (!allKeys.has(key)) { allKeys.add(key); keySources[key] = []; }
                if (!keySources[key].some(function(s) { return s.snippet === line.trim(); })) {
                  keySources[key].push({ path: p, snippet: line.trim(), isBinaryBypass: true, originalTerm: 'Binary Bypass', category: 'Tentativa de Bypass' });
                }
              }
            });
            return;
          }

          // Se for o MCState.log, processa APENAS os bypasses (lógica linha a linha) e ignora TODO o resto
          if (isMCState) {
            var lines = txt.split(/\r?\n/);
            var bypassTerms = ['icebypass', 'lunarbypass', 'dashbypass', 'zeexbypass', 'bypass'];
            
            lines.forEach(function(line, index) {
              var lowerLine = line.toLowerCase();
              bypassTerms.forEach(function(term) {
                if (lowerLine.indexOf(term) !== -1) {
                  // Cria uma chave única baseada no termo encontrado
                  var bypassKey = "BYPASS_" + term;
                  if (!allKeys.has(bypassKey)) {
                    allKeys.add(bypassKey);
                    keySources[bypassKey] = [];
                  }
                  
                  // Adiciona a linha como evidência se ainda não estiver lá
                  if (!keySources[bypassKey].some(function(s) { return s.snippet === line.trim(); })) {
                    keySources[bypassKey].push({
                      path: p,
                      snippet: line.trim(),
                      isBypass: true,
                      originalTerm: term,
                      lineNum: index + 1
                    });
                  }
                }
              });
            });
            return; // Garante que o MCState.log não passe por nenhuma outra função (iniciais, tokens, etc)
          }

          // Se for o kbdebug.txt, processa a detecção de Jailbreak/Sideload
          if (isKBDebug) {
            var lines = txt.split(/\r?\n/);
            var jailbreakTerms = ['facebook.messenger'];
            
            lines.forEach(function(line, index) {
              var lowerLine = line.toLowerCase();
              jailbreakTerms.forEach(function(term) {
                if (lowerLine.indexOf(term) !== -1) {
                  var jbKey = "JB_" + term;
                  if (!allKeys.has(jbKey)) {
                    allKeys.add(jbKey);
                    keySources[jbKey] = [];
                  }
                  if (!keySources[jbKey].some(function(s) { return s.snippet === line.trim(); })) {
                    keySources[jbKey].push({
                      path: p,
                      snippet: line.trim(),
                      isJailbreak: true,
                      originalTerm: term,
                      lineNum: index + 1
                    });
                  }
                }
              });
            });
            // Não retorna aqui, pois kbdebug pode conter outras chaves úteis se for texto legível
          }

          // Processamento normal para os outros arquivos
          var keyRe = /<key>([^<]+)<\/key>/g;
          var km;
          while ((km = keyRe.exec(txt))) {
            var k = km[1];
            allKeys.add(k);
            if (!keySources[k]) keySources[k] = [];
            if (!keySources[k].some(function(s) { return s.path === p; })) {
              var snipStart = Math.max(0, km.index - 20);
              var snipEnd = Math.min(txt.length, km.index + 260);
              keySources[k].push({ path: p, snippet: txt.slice(snipStart, snipEnd).trim() });
            }
          }

          if (isSafeForTokenScan(p)) {
            var tokenRe = /[A-Za-z0-9][A-Za-z0-9_.\-]{5,79}/g;
            var tm;
            while ((tm = tokenRe.exec(txt))) {
              var tok = tm[0];
              if (!allKeys.has(tok)) {
                allKeys.add(tok);
                if (!keySources[tok]) keySources[tok] = [];
              }
              if (keySources[tok] && !keySources[tok].some(function(s) { return s.path === p; })) {
                var tStart = Math.max(0, tm.index - 20);
                var tEnd = Math.min(txt.length, tm.index + 260);
                keySources[tok].push({ path: p, snippet: txt.slice(tStart, tEnd).trim() });
              }
            }
          }

          extractDictBlocks(txt).forEach(function(block) {
            var ev = parseEventFromBlock(block);
            if (!ev) return;
            var dedupeKey = ev.process + '|' + ev.timestamp + '|' + ev.event;
            if (seenEvents.has(dedupeKey)) return;
            seenEvents.add(dedupeKey);
            ev.path = p;
            ev.rawBlock = block.trim();
            timelineEvents.push(ev);
          });
        }).catch(function(){}).then(function() {
          done++;
          var pct = 35 + Math.round((done / total) * 55);
          setProgress(pct, 'Lendo dados... ' + done + '/' + total);
          if (done === total) finishIOSScan(allKeys, timelineEvents, keySources);
        });
      });
    }).catch(function() {
      showError('Não foi possível ler as informações do dispositivo neste sysdiagnose.');
      dropEl.style.display = 'block';
    });
  }

  function extractPlistKeys(text) {
    var keys = [];
    var re = /<key>([^<]+)<\/key>/g;
    var m;
    while ((m = re.exec(text))) keys.push(m[1]);
    return keys;
  }

  // Extrai os blocos <dict>...</dict> (respeitando aninhamento) de um plist em texto
  function extractDictBlocks(text) {
    var blocks = [];
    var stack = [];
    var tagRe = /<dict\/?>|<\/dict>/g;
    var m;
    while ((m = tagRe.exec(text))) {
      if (m[0] === '<dict/>') continue;
      if (m[0] === '<dict>') {
        stack.push(m.index + m[0].length);
      } else if (stack.length) {
        var start = stack.pop();
        blocks.push(text.substring(start, m.index));
      }
    }
    return blocks;
  }

  // Extrai { event, process, timestamp } de um bloco <dict>, se presente
  function parseEventFromBlock(block) {
    var event = (block.match(/<key>event<\/key>\s*<string>([^<]*)<\/string>/i) || [])[1];
    var process = (block.match(/<key>process<\/key>\s*<string>([^<]*)<\/string>/i) || [])[1];
    var timestamp = (block.match(/<key>timestamp<\/key>\s*<date>([^<]*)<\/date>/i) || [])[1];
    if (event && process && timestamp) return { event: event, process: process, timestamp: timestamp };
    return null;
  }

  function isBoundaryChar(ch) {
    return ch === '' || ch === undefined || ch === '.' || ch === '-' || ch === '_' || ch === '/' || ch === ':';
  }

  // Match "exact" exige que o valor apareça isolado por bordas (início/fim ou separador),
  // não como substring solta dentro de outra palavra (ex: "mit" dentro de "Committed").
  function boundaryIncludes(lowerKey, v) {
    var idx = lowerKey.indexOf(v);
    if (idx === -1) return false;
    var before = idx === 0 ? '' : lowerKey[idx - 1];
    var after = (idx + v.length >= lowerKey.length) ? '' : lowerKey[idx + v.length];
    return isBoundaryChar(before) && isBoundaryChar(after);
  }

  // Um "prefixo" só faz sentido testar contra o hash de perfil/certificado de verdade
  // (~65 caracteres hex, sem traços), NÃO contra um UUID padrão do iOS (36 caracteres,
  // formato 8-4-4-4-12) — esse é usado em qualquer coisa genérica do sistema e não é
  // evidência de nada. Sem essa distinção, um UUID aleatório qualquer bate só por sorte
  // no prefixo de 2-3 caracteres.
  var STANDARD_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var MIN_HASH_LENGTH = 40; // bem acima dos 32 dígitos hex de um UUID padrão, folga confortável

  function looksLikeHash(key) {
    if (STANDARD_UUID_RE.test(key)) return false; // UUID padrão do iOS: nunca é o hash de proxy
    var stripped = key.replace(/[-._\s]/g, '');
    return stripped.length >= MIN_HASH_LENGTH && /^[0-9a-fA-F]+$/.test(stripped);
  }

  function matchIOSKey(key) {
    var lowerKey = key.toLowerCase();
    for (var i = 0; i < IOS_PACKAGE_DB.length; i++) {
      var entry = IOS_PACKAGE_DB[i];
      var v = entry.value.toLowerCase();
      if (entry.match === 'prefix' && looksLikeHash(key) && lowerKey.indexOf(v) === 0) return entry;
      if (entry.match === 'exact' && boundaryIncludes(lowerKey, v)) return entry;
    }
    return null;
  }

  function formatTimestamp(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    function pad(n) { return String(n).padStart(2, '0'); }
    return pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear() + ' ' +
      pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + ' UTC';
  }

  function finishIOSScan(allKeys, timelineEvents, keySources) {
    keySources = keySources || {};
    // Casa cada evento da timeline com a base de perfis/certificados suspeitos
    var matchedTimeline = [];
    timelineEvents.forEach(function(ev) {
      var entry = matchIOSKey(ev.process);
      if (entry) {
        matchedTimeline.push({
          category: entry.category,
          process: ev.process,
          event: ev.event.toLowerCase(),
          timestamp: ev.timestamp,
          path: ev.path,
          rawBlock: ev.rawBlock
        });
      }
    });
    // Mais recente primeiro
    matchedTimeline.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });

    var timelineProcesses = new Set(matchedTimeline.map(function(e) { return e.process; }));

    // Fallback: perfis encontrados só como "presentes" (sem timeline), que ainda não apareceram acima
    var presentOnly = [];
    allKeys.forEach(function(key) {
      if (timelineProcesses.has(key)) return;
      
      // Se for um bypass detectado manualmente no MCState.log
      if (key.indexOf("BYPASS_") === 0 && keySources[key] && keySources[key].length > 0) {
        var src = keySources[key][0];
        presentOnly.push({ 
          category: 'Tentativa de Bypass', 
          matchType: 'exact', 
          matchedValue: src.originalTerm, 
          key: src.originalTerm, 
          sources: keySources[key] 
        });
        return;
      }

      // Se for uma detecção no kbdebug.txt (Jailbreak/Sideload)
      if (key.indexOf("JB_") === 0 && keySources[key] && keySources[key].length > 0) {
        var src = keySources[key][0];
        presentOnly.push({ 
          category: 'Sideload/Jailbreak', 
          matchType: 'exact', 
          matchedValue: src.originalTerm, 
          key: src.originalTerm, 
          sources: keySources[key] 
        });
        return;
      }

      // Se for Proxy Injection ou Binary Bypass detectado manualmente
      if ((key === "PROXY_INJECTION" || key === "BINARY_BYPASS") && keySources[key] && keySources[key].length > 0) {
        var src = keySources[key][0];
        presentOnly.push({ 
          category: src.category, 
          matchType: 'exact', 
          matchedValue: src.originalTerm, 
          key: src.originalTerm, 
          sources: keySources[key] 
        });
        return;
      }

      var entry = matchIOSKey(key);
      if (entry) presentOnly.push({ category: entry.category, matchType: entry.match, matchedValue: entry.value, key: key, sources: keySources[key] || [] });
    });

    var totalAlerts = matchedTimeline.length + presentOnly.length;

    setProgress(100, 'Concluído');
    setTimeout(function() {
      progressWrap.style.display = 'none';
      resultsEl.style.display = 'block';
      androidPanel.style.display = 'none';
      iosPanel.style.display = 'block';

      iosAppsCount.textContent = '0';
      iosAlertCount.textContent = String(totalAlerts);
      iosProfileCount.textContent = String(allKeys.size);

      iosEvents.innerHTML = '';

      if (totalAlerts > 0) {
        verdictDot.style.background = 'var(--danger)';
        verdictTitle.textContent = '⚠ Perfis suspeitos encontrados';
        verdictTitle.style.color = 'var(--danger)';
        verdictDesc.textContent = totalAlerts + ' perfil(is)/certificado(s) suspeito(s) neste sysdiagnose.';
        iosSummary.textContent = totalAlerts + ' perfil(is) encontrado(s).';

        // Agrupa tudo (timeline + presente) por categoria, preservando a ordem da IOS_PACKAGE_DB
        var categoryOrder = [];
        var byCategory = {};
        function pushToCategory(cat, node) {
          if (!byCategory[cat]) { byCategory[cat] = []; categoryOrder.push(cat); }
          byCategory[cat].push(node);
        }

        var logCounter = 0;
        function buildLogSection(pathsText, rawText) {
          var logId = 'ioslog_' + (logCounter++);
          var full = '📁 Encontrado em: ' + pathsText + '\n\n' + rawText;
          return {
            html: '<button class="finding-log-btn" data-target="' + logId + '">🔍 VER LOG EXATA</button>' +
                  '<pre class="finding-log" id="' + logId + '"></pre>',
            logId: logId,
            content: full
          };
        }
        function wireLogButton(card, section) {
          var pre = card.querySelector('#' + section.logId);
          pre.textContent = section.content;
          var btn = card.querySelector('.finding-log-btn');
          btn.addEventListener('click', function() {
            pre.classList.toggle('open');
            btn.textContent = pre.classList.contains('open') ? '▲ OCULTAR LOG' : '🔍 VER LOG EXATA';
          });
        }

        matchedTimeline.forEach(function(ev) {
          var card = document.createElement('div');
          card.className = 'ios-event';
          
          var logText = ev.rawBlock || ev.process;
          var cleaned = cleanLogLine(logText, ev.process);
          var highlighted = highlightTerm(cleaned, ev.process, ev.category);
          
          card.innerHTML = 
            '<div class="ios-event-id" style="color:var(--danger); font-weight:bold; margin-bottom:8px;">' + escapeHtml(ev.process) + '</div>' +
            '<div class="cat-item-log-wrapper">' +
              '<span class="cat-item-log">' + highlighted + '</span>' +
            '</div>';
          pushToCategory(ev.category, card);
        });

        presentOnly.forEach(function(m) {
          var card = document.createElement('div');
          card.className = 'ios-event';
          
          var logText = m.sources.length ? m.sources[0].snippet : m.key;
          var cleaned = cleanLogLine(logText, m.key);
          var highlighted = highlightTerm(cleaned, m.key, m.category);

          card.innerHTML =
            '<div class="ios-event-id" style="color:var(--danger); font-weight:bold; margin-bottom:8px;">' + escapeHtml(m.key) + '</div>' +
            '<div class="cat-item-log-wrapper">' +
              '<span class="cat-item-log">' + highlighted + '</span>' +
            '</div>';
          pushToCategory(m.category, card);
        });

        categoryOrder.forEach(function(cat) {
          var section = document.createElement('div');
          section.className = 'ios-category-section';
          var header = document.createElement('div');
          header.className = 'ios-category-header';
          header.innerHTML =
            '<span class="ios-category-name">' + escapeHtml(cat) + '</span>' +
            '<span class="ios-category-badge">' + byCategory[cat].length + '</span>';
          section.appendChild(header);
          byCategory[cat].forEach(function(card) { section.appendChild(card); });
          iosEvents.appendChild(section);
        });
      } else {
        verdictDot.style.background = 'var(--ok)';
        verdictTitle.textContent = '✔ Nenhum perfil suspeito';
        verdictTitle.style.color = 'var(--ok)';
        verdictDesc.textContent = 'Nenhum perfil/certificado da base de dados foi encontrado.';
        iosSummary.textContent = allKeys.size + ' identificador(es) de perfil lido(s), nenhum suspeito.';
      }

      incrementScanCount();
    }, 300);
  }

  function extractPlistValue(plistText, key) {
    var re = new RegExp('<key>' + key + '</key>\\s*<string>([^<]*)</string>', 'i');
    var m = plistText.match(re);
    return m ? m[1] : '';
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // App alvo que o scanner valida como instalação oficial (ajuste pkg/instaladores se mudar o jogo-alvo)
  var TARGET_APP = {
    pkg: 'com.dts.freefireth',
    name: 'Free Fire',
    icon: '🎮',
    officialInstallers: ['com.android.vending']
  };

  function extractGetprop(text) {
    var props = {};
    var re = /\[([\w.\-]+)\]:\s*\[([^\]]*)\]/g;
    var m;
    while ((m = re.exec(text))) props[m[1]] = m[2];
    return props;
  }

  function getPackageBlock(text, pkgName) {
    var marker = 'Package [' + pkgName + ']';
    var idx = text.indexOf(marker);
    if (idx === -1) return null;
    var nextIdx = text.indexOf('Package [', idx + marker.length);
    var end = nextIdx === -1 ? Math.min(text.length, idx + 4000) : nextIdx;
    return text.substring(idx, end);
  }

  function parsePackageInfo(block) {
    if (!block) return null;
    var firstInstall = (block.match(/firstInstallTime=([^\r\n]+)/) || [])[1];
    var lastUpdate = (block.match(/lastUpdateTime=([^\r\n]+)/) || [])[1];
    var installer = (block.match(/installerPackageName=([^\r\n]+)/) || [])[1];
    return {
      firstInstallTime: firstInstall ? firstInstall.trim() : null,
      lastUpdateTime: lastUpdate ? lastUpdate.trim() : null,
      installerPackageName: installer ? installer.trim() : null
    };
  }

  function formatAndroidTimestamp(raw) {
    if (!raw) return null;
    if (/^\d+$/.test(raw)) {
      var d = new Date(parseInt(raw, 10));
      if (!isNaN(d.getTime())) return formatTimestamp(d.toISOString());
    }
    return raw;
  }

  function parseAndroidLogDate(line) {
    // Formato: 23/06/2026 21:13
    var m = line.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    if (m) return new Date(m[3], m[2] - 1, m[1], m[4], m[5]);
    // Formato alternativo: 06-23 21:13:00.000
    m = line.match(/(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (m) return new Date(new Date().getFullYear(), m[1] - 1, m[2], m[3], m[4]);
    return null;
  }

  function cleanLogLine(line, searchTerm) {
    var cleaned = line.trim();
    
    // Se a linha for muito grande ou tiver muitos dados irrelevantes, foca no termo
    if (searchTerm) {
      var lowerLine = cleaned.toLowerCase();
      var lowerTerm = searchTerm.toLowerCase();
      var termIdx = lowerLine.indexOf(lowerTerm);
      
      if (termIdx !== -1) {
        // Pega um trecho bem curto ao redor do termo para não poluir
        var start = Math.max(0, termIdx - 30);
        var end = Math.min(cleaned.length, termIdx + 60);
        var prefix = start > 0 ? "..." : "";
        var suffix = end < cleaned.length ? "..." : "";
        cleaned = prefix + cleaned.substring(start, end).trim() + suffix;
      }
    }
    
    return cleaned;
  }

  function highlightTerm(text, term, category) {
    if (!term) return escapeHtml(text);
    
    var lowerTerm = term.toLowerCase();
    var lowerCat = (category || "").toLowerCase();
    
    // Termos que SEMPRE devem ter highlight
    var forceHighlight = [
      'esign', 'filza', 'troll', 'bypass', 'icebypass', 'lunarbypass', 'dashbypass', 'zeexbypass', 
      'adb.tcp.port', 'uninstall', 'install', 'facebook.messenger', 'proxy', 'injection', 'binary'
    ];
    var isForced = forceHighlight.some(function(t) { return lowerTerm.indexOf(t) !== -1 || lowerCat.indexOf(t) !== -1; });
    
    // Se for categoria de Proxy (Android ou iOS) e não for um termo forçado, agora fazemos highlight de qualquer forma
    // mas mantemos a lógica de isForced para garantir que termos específicos brilhem.
    
    var cleanTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Regex para destacar o termo original OU qualquer um dos termos forçados que apareçam na log
    var re = new RegExp('(' + cleanTerm + '|adb\\.tcp\\.port|Uninstall|Install|bypass|esign|filza|trollstore|trollinstaller|proxy injection|binary bypass|facebook\\.messenger)', 'gi');
    return escapeHtml(text).replace(re, '<span class="log-highlight">$1</span>');
  }

  // ============ ANÁLISE DE TEXTO / FILTRO DE PACOTES ============
  function analyzeFiles(fileContents) {
    setProgress(90, 'Comparando com base de pacotes...');

    var combinedText = fileContents.map(function(f) { return f.content; }).join('\n');
    var matches = []; // { group, label, pkg, count, logLines, sources, installInfo }

    // Busca entry.pkg em todos os arquivos, mantendo de qual arquivo cada ocorrência veio
    function searchAcrossFiles(needle, caseInsensitive, excludeRe) {
      var hits = []; // [{ path, line }]
      fileContents.forEach(function(f) {
        var lines = f.content.split(/\r?\n/);
        for (var i = 0; i < lines.length; i++) {
          var hay = caseInsensitive ? lines[i].toLowerCase() : lines[i];
          var n = caseInsensitive ? needle.toLowerCase() : needle;
          if (hay.indexOf(n) !== -1) {
            if (excludeRe && excludeRe.test(lines[i])) continue; // falso positivo conhecido, pula
            hits.push({ path: f.path, line: lines[i].trim() });
            if (hits.length >= 30) return hits; // limite pra não travar a tela
          }
        }
      });
      return hits;
    }

    function uniquePaths(hits) {
      var seen = {};
      var out = [];
      hits.forEach(function(h) { if (!seen[h.path]) { seen[h.path] = true; out.push(h.path); } });
      return out;
    }

    PACKAGE_DB.forEach(function(entry) {
      var hits = searchAcrossFiles(entry.pkg, !!entry.caseInsensitive, entry.exclude);
      if (hits.length) {
        var installInfo = parsePackageInfo(getPackageBlock(combinedText, entry.pkg));
        matches.push({
          group: entry.group,
          label: entry.label,
          pkg: entry.pkg,
          count: hits.length,
          logLines: hits.map(function(h) { return h.line; }),
          sources: uniquePaths(hits),
          installInfo: installInfo
        });
      }
    });

    // Propriedades do dispositivo (getprop) — normalmente concentradas num único arquivo principal
    var props = extractGetprop(combinedText);

    // ---- Acesso remoto via ADB/rede ----
    // Cobre 3 formatos diferentes de evidência que aparecem em bugreports reais:
    //  1) getprop no formato "[chave]: [valor]" (dump padrão de propriedades)
    //  2) "chave=valor" solto (saída crua de "getprop chave" rodado via shell)
    //  3) socket realmente em LISTEN na porta (confirma que não é só configuração, é porta ativa)
    var adbTcpPort = props['service.adb.tcp.port'] || props['persist.adb.tcp.port'];

    var plainKeyValueHits = [];
    fileContents.forEach(function(f) {
      var lines = f.content.split(/\r?\n/);
      lines.forEach(function(l) {
        // Captura tanto a atribuição chave=valor quanto a log de serviço adbd
        var m = l.match(/\b(service\.adb\.tcp\.port|persist\.adb\.tcp\.port)\s*=\s*(\d+)/i);
        var isAdbdService = /adbd\s*:\s*adbd service requested.*adb\.tcp\.port/i.test(l);
        if (m || isAdbdService) {
          plainKeyValueHits.push({ path: f.path, line: l.trim(), port: m ? m[2] : null });
        }
      });
    });

    if (plainKeyValueHits.length) {
      var detectedPort = plainKeyValueHits.find(function(h){ return h.port; });
      var portLabel = detectedPort ? detectedPort.port : "5555";
      
      matches.push({
        group: 'Acesso Remoto (ADB/Rede)',
        label: 'Remote detectado: porta ' + portLabel + ' aberta (acesso remoto via ADB/rede)',
        pkg: 'adb.tcp.port',
        count: 1, // Um único item de detecção
        logLines: plainKeyValueHits.map(function(h) { return h.line; }),
        sources: uniquePaths(plainKeyValueHits),
        installInfo: null
      });
    }

    // ---- Pareamentos ADB/USB (padrões exatos, com tipo de conexão + direção) ----
    // Cada padrão abaixo é uma assinatura de log real e específica do Android (adbd/AdbDebuggingManager),
    // não um heurístico genérico — isso é o que reduz o falso positivo comparado a "contém a palavra usb/adb".
    var PAIRING_PATTERNS = [
      { re: /adbd_wifi_secure_connect:\s*connected/i, type: 'WIRELESS', dir: 'ENTRADA' },
      { re: /adbd_wifi_secure_connect:\s*disconnected/i, type: 'WIRELESS', dir: 'SAÍDA' },
      { re: /adbd_usb_secure_connect:\s*connected/i, type: 'USB', dir: 'ENTRADA' },
      { re: /adbd_usb_secure_connect:\s*disconnected/i, type: 'USB', dir: 'SAÍDA' },
      { re: /AdbDebuggingManager:\s*Received WIFI TLS connected key message/i, type: 'WIRELESS', dir: 'ENTRADA' },
      { re: /AdbDebuggingManager:\s*Received USB TLS connected key message/i, type: 'USB', dir: 'ENTRADA' },
      { re: /AdbDebuggingManager.*\(Received\s*\(connected\|public\)\s*key\|Logging key\)/i, type: 'AUTORIZAÇÃO', dir: 'ENTRADA' },
      { re: /AdbDebuggingManager.*WIFI TLS connected key.*u0_a/i, type: 'WIRELESS', dir: 'ENTRADA' },
      { re: /AdbDebuggingManager.*\(WIFI TLS\|TLS connected\|tls\.\*connect\)/i, type: 'WIRELESS', dir: 'ENTRADA' },
      { re: /adbd\s*:\s*adbd service requested.*getprop.*adb\.tcp\.port/i, type: 'SHELL', dir: 'CONSULTA' },
      { re: /(service|persist)\.adb\.tcp\.port\s*=\s*\d+/i, type: 'CONFIG', dir: 'ATIVA' }
    ];
    var LOGCAT_TS_RE = /^(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d+)/;

    var pairingHits = [];
    fileContents.forEach(function(f) {
      var lines = f.content.split(/\r?\n/);
      for (var i = 0; i < lines.length; i++) {
        var l = lines[i];
        for (var p = 0; p < PAIRING_PATTERNS.length; p++) {
          if (PAIRING_PATTERNS[p].re.test(l)) {
            var tsMatch = l.match(LOGCAT_TS_RE);
            pairingHits.push({
              path: f.path,
              line: l.trim(),
              timestamp: tsMatch ? tsMatch[1] : null,
              type: PAIRING_PATTERNS[p].type,
              dir: PAIRING_PATTERNS[p].dir
            });
            break; // um padrão já basta pra essa linha
          }
        }
        if (pairingHits.length >= 50) break;
      }
    });

    if (pairingHits.length) {
      matches.push({
        group: 'Pareamentos ADB/USB',
        label: 'Eventos de pareamento/conexão ADB via USB ou Wi-Fi',
        pkg: pairingHits.length + ' evento(s) de pareamento detectado(s)',
        count: pairingHits.length,
        logLines: pairingHits.map(function(h) {
          return (h.timestamp ? h.timestamp + '  ' : '') + '[ PC/CELULAR (' + h.type + ') ] [ ' + h.dir + ' ]\nLOG: ' + h.line;
        }),
        sources: uniquePaths(pairingHits),
        pairingHits: pairingHits,
        installInfo: null
      });
    }

    var device = {
      model: props['ro.product.model'] || props['ro.product.marketname'] || '-',
      manufacturer: props['ro.product.manufacturer'] || '-',
      brand: props['ro.product.brand'] || '-',
      androidVersion: props['ro.build.version.release'] || '-',
      sdk: props['ro.build.version.sdk'] || '-',
      buildId: props['ro.build.id'] || '-',
      buildType: props['ro.build.type'] || '-',
      fingerprint: props['ro.build.fingerprint'] || props['ro.bootimage.build.fingerprint'] || '-',
      serial: props['ro.serialno'] || props['ro.boot.serialno'] || '-'
    };

    var flashLocked = props['ro.boot.flash.locked'];
    var vbState = props['ro.boot.vbmeta.device_state'];
    var bootloaderText = '-', bootloaderOk = true;
    if (flashLocked === '1' || vbState === 'locked') { bootloaderText = 'Bloqueado'; bootloaderOk = true; }
    else if (flashLocked === '0' || vbState === 'unlocked') { bootloaderText = 'Desbloqueado'; bootloaderOk = false; }

    var verifiedBoot = props['ro.boot.verifiedbootstate'] || '-';
    var verifiedBootOk = verifiedBoot === 'green';

    var signatureMatch = device.fingerprint.match(/(release-keys|test-keys|dev-keys)/);
    var signature = signatureMatch ? signatureMatch[1] : '-';
    var signatureOk = signature === 'release-keys';

    var debuggableRaw = props['ro.debuggable'];
    var debuggableText = debuggableRaw === '1' ? 'Sim' : (debuggableRaw === '0' ? 'Não' : '-');
    var debuggableOk = debuggableRaw !== '1';

    var secureRaw = props['ro.secure'];
    var secureText = secureRaw === '1' ? 'Sim' : (secureRaw === '0' ? 'Não' : '-');
    var secureOk = secureRaw === '1';

    // ---- Modo USB (sys.usb.state costuma listar as funções ativas, ex: "mtp,adb") ----
    var usbStateRaw = props['sys.usb.state'] || props['persist.sys.usb.config'] || props['sys.usb.config'] || '';
    var USB_FUNC_LABELS = { mtp: 'MTP', ptp: 'PTP', adb: 'ADB', rndis: 'RNDIS (rede)', midi: 'MIDI', accessory: 'Accessory', none: 'Nenhum', ncm: 'NCM (rede)' };
    var usbFuncs = usbStateRaw ? usbStateRaw.split(',').map(function(f) { return f.trim().toLowerCase(); }).filter(Boolean) : [];
    var usbModeText = usbFuncs.length ? usbFuncs.map(function(f) { return USB_FUNC_LABELS[f] || f; }).join(' + ') : '-';
    var usbAdbActive = usbFuncs.indexOf('adb') !== -1;

    var systemState = [
      { label: 'Bootloader', val: bootloaderText, ok: bootloaderOk },
      { label: 'Verified Boot', val: verifiedBoot, ok: verifiedBootOk },
      { label: 'Assinatura do build', val: signature, ok: signatureOk },
      { label: 'Debuggable', val: debuggableText, ok: debuggableOk },
      { label: 'Modo seguro (ro.secure)', val: secureText, ok: secureOk },
      { label: 'Modo USB (sys.usb.state)', val: usbModeText, ok: true }
    ];

    // App alvo (ex: Free Fire) — confere se a instalação bate com a loja oficial
    var targetInfo = parsePackageInfo(getPackageBlock(combinedText, TARGET_APP.pkg));

    setProgress(100, 'Concluído');
    setTimeout(function() {
      progressWrap.style.display = 'none';
      renderResults(matches, device, systemState, targetInfo);
      incrementScanCount();
    }, 300);
  }

  function formatFileSize(bytes) {
    if (!bytes && bytes !== 0) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function buildTagPills(text) {
    // Quebra uma linha de log em "pedaços" (separados por vírgula/espaço) e monta pills,
    // pra ficar igual à referência visual em vez de um bloco de texto corrido.
    var parts = text.split(/[,\s]+/).filter(Boolean);
    if (parts.length < 2) return null; // não vale a pena virar pill, mostra cru mesmo
    return parts.map(function(p) { return '<span class="tag-pill">' + escapeHtml(p) + '</span>'; }).join('');
  }

  function renderResults(matches, device, systemState, targetInfo) {
    resultsEl.style.display = 'block';
    categoryCardsEl.innerHTML = '';
    iosPanel.style.display = 'none';
    androidPanel.style.display = 'block';

    var total = matches.length;

    // ---- Barra de info do arquivo ----
    if (currentFileInfo) {
      fileInfoBar.innerHTML =
        'Arquivo: <b>' + escapeHtml(currentFileInfo.name) + '</b> | Tamanho: <b>' + formatFileSize(currentFileInfo.size) + '</b> | ' +
        'Análise: <b>' + formatTimestamp(new Date().toISOString()) + '</b>';
    } else {
      fileInfoBar.innerHTML = '';
    }

    // ---- Device info ----
    andModel.textContent = device.model;
    andManufacturer.textContent = device.manufacturer;
    andBrand.textContent = device.brand;
    andVersion.textContent = device.androidVersion;
    andSdk.textContent = device.sdk;
    andBuildId.textContent = device.buildId;
    andBuildType.textContent = device.buildType;
    andFingerprint.textContent = device.fingerprint;
    andSerial.textContent = device.serial;

    // ---- Estado do sistema ----
    stateList.innerHTML = '';
    systemState.forEach(function(s) {
      var row = document.createElement('div');
      row.className = 'state-row';
      row.innerHTML =
        '<div class="state-row-label"><span class="state-dot' + (s.ok ? '' : ' warn') + '"></span>' + escapeHtml(s.label) + '</div>' +
        '<div class="state-val">' + escapeHtml(String(s.val)) + '</div>';
      stateList.appendChild(row);
    });

    // ---- Hero de Verified Boot ----
    var vbRow = systemState.filter(function(s) { return s.label === 'Verified Boot'; })[0];
    var vbOk = vbRow ? vbRow.ok : false;
    var vbVal = vbRow ? vbRow.val : '-';
    verifiedBootHero.className = 'verified-boot-hero' + (vbOk ? '' : ' warn');
    vbhIcon.textContent = vbOk ? '🔒' : '🔓';
    vbhValue.textContent = String(vbVal).toUpperCase();
    vbhDesc.textContent = vbOk
      ? 'Bootloader bloqueado — dispositivo íntegro'
      : 'Bootloader desbloqueado ou estado de boot alterado — dispositivo pode ter sido modificado';

    // ---- App alvo ----
    if (targetInfo) {
      var isOfficial = targetInfo.installerPackageName && TARGET_APP.officialInstallers.indexOf(targetInfo.installerPackageName) !== -1;
      appIdCard.style.display = 'block';
      appIdBox.className = 'app-id-box ' + (isOfficial ? 'ok' : 'warn');
      appIdTitle.textContent = (isOfficial ? '✅ ' : '⚠ ') + TARGET_APP.name + ' ' + (isOfficial ? 'Normal: Oficial (Play Store)' : '— instalador não reconhecido');
      var detailLines = [];
      detailLines.push('📦 Pacote: ' + TARGET_APP.pkg);
      if (targetInfo.firstInstallTime) detailLines.push('🗓 Primeira instalação: ' + formatAndroidTimestamp(targetInfo.firstInstallTime));
      if (targetInfo.lastUpdateTime) detailLines.push('🔄 Última atualização: ' + formatAndroidTimestamp(targetInfo.lastUpdateTime));
      detailLines.push('📲 Instalador: ' + (targetInfo.installerPackageName || 'desconhecido'));
      appIdDetail.innerHTML = detailLines.map(escapeHtml).join('<br>');
    } else {
      appIdCard.style.display = 'none';
    }

    // ---- Veredito geral ----
    var hasRemoteAccess = matches.some(function(m) { return m.group === 'Acesso Remoto (ADB/Rede)'; });
    var hasProxyMatch = matches.some(function(m) { return m.group === 'Proxy Externo' || m.group === 'Aplicativo Disfarçado'; });
    var hasRootMatch = matches.some(function(m) { return m.group === 'Rastros de Root'; });
    var hasSuspeitaMatch = matches.some(function(m) { return m.group === 'Suspeita'; });

    if (total > 0) {
      verdictDot.style.background = 'var(--danger)';
      verdictTitle.style.color = 'var(--danger)';
      if (hasRemoteAccess) {
        verdictTitle.textContent = 'ACESSO REMOTO DETECTADO';
        verdictDesc.textContent = 'O aparelho está com ADB acessível via rede (porta TCP aberta), permitindo controle remoto do dispositivo.';
      } else if (hasProxyMatch) {
        verdictTitle.textContent = 'PROXY EXTERNO IDENTIFICADO';
        verdictDesc.textContent = 'Foi encontrado um proxy/injetor externo conhecido, usado para interceptar ou alterar o tráfego do jogo.';
      } else if (hasRootMatch) {
        verdictTitle.textContent = 'RASTROS DE ROOT ENCONTRADOS';
        verdictDesc.textContent = 'Foram encontrados indícios de root/acesso privilegiado (Magisk, APatch, Zygisk ou Shizuku) no aparelho.';
      } else if (hasSuspeitaMatch) {
        verdictTitle.textContent = '⚠ FERRAMENTA SUSPEITA IDENTIFICADA';
        verdictDesc.textContent = 'Foi encontrada uma ferramenta de acesso/modificação (ex: Termux, MT Manager) instalada no aparelho.';
      } else {
        verdictTitle.textContent = '⚠ Pareamento ADB/USB encontrado';
        verdictDesc.textContent = 'Foram encontrados eventos de pareamento ADB/USB no log.';
      }
    } else {
      verdictDot.style.background = 'var(--ok)';
      verdictTitle.style.color = 'var(--ok)';
      verdictTitle.textContent = '✔ Nenhum indício encontrado';
      verdictDesc.textContent = 'Nenhum pacote da base de dados foi encontrado neste bugreport.';
    }

    renderCategoryCards(matches);
  }

  // Categorias de topo mostradas como cards colapsáveis (igual à referência visual)
  var TOP_CATEGORIES = [
    { key: 'proxy', title: 'PACOTES PROXY', groups: ['Proxy Externo', 'Aplicativo Disfarçado'] },
    { key: 'root', title: 'RASTROS DE ROOT', groups: ['Rastros de Root'] },
    { key: 'suspeita', title: 'FERRAMENTAS SUSPEITAS', groups: ['Suspeita'] },
    { key: 'pareamento', title: 'PAREAMENTOS ADB/USB', groups: ['Pareamentos ADB/USB', 'Acesso Remoto (ADB/Rede)'] }
  ];

  function renderCategoryCards(matches) {
    var logCounter = 0;

    TOP_CATEGORIES.forEach(function(cat) {
      var catMatches = matches.filter(function(m) { return cat.groups.indexOf(m.group) !== -1; });
      // Contagem de itens únicos (pacotes ou tipos de detecção) em vez de total de logs
      var count = catMatches.length;

      // Lógica para encontrar a instalação/desinstalação mais antiga e mais recente em toda a categoria
      var globalOldest = null, globalNewest = null;
      var hasAnyImportant = false;
      if (cat.key === 'proxy' || cat.key === 'root') {
        var allImportant = [];
        catMatches.forEach(function(m) {
          (m.logLines || []).forEach(function(l) {
            if (l.indexOf('Uninstall') !== -1 || l.indexOf('Install') !== -1) {
              var d = parseAndroidLogDate(l);
              if (d) {
                allImportant.push({ date: d, line: l });
                hasAnyImportant = true;
              }
            }
          });
        });
        if (allImportant.length > 0) {
          allImportant.sort(function(a, b) { return a.date - b.date; });
          globalOldest = allImportant[0].line;
          globalNewest = allImportant[allImportant.length - 1].line;
        }
      }

      var card = document.createElement('div');
      card.className = 'cat-card' + (count > 0 ? ' has-alert' : '') + ' collapsed';

      var header = document.createElement('div');
      header.className = 'cat-card-header';
      header.innerHTML =
        '<span class="cat-card-badge' + (count > 0 ? ' alert' : '') + '">' + count + '</span>' +
        '<span class="cat-card-title">' + escapeHtml(cat.title) + '</span>' +
        '<span class="cat-card-arrow">⌄</span>';
      card.appendChild(header);

      var body = document.createElement('div');
      body.className = 'cat-card-body';

      if (!catMatches.length) {
        body.innerHTML = '<div class="cat-card-empty">Nenhum indício encontrado nesta categoria.</div>';
      } else {
        catMatches.forEach(function(m) {
          var item = document.createElement('div');
          item.className = 'cat-item';

          // Pareamentos ADB/USB têm um layout próprio; o resto mostra apenas o trecho de log
          var bodyHtml;
          var titleText;
          if (m.pairingHits) {
            titleText = m.label;
            bodyHtml = m.pairingHits.slice(0, 5).map(function(h) {
              return '<div class="pairing-entry">' +
                (h.timestamp ? '<div class="pairing-ts">' + escapeHtml(h.timestamp) + '</div>' : '') +
                '<div class="pairing-tags"><span class="pairing-tag type">[ PC/CELULAR (' + escapeHtml(h.type) + ') ]</span> <span class="pairing-tag dir">[ ' + escapeHtml(h.dir) + ' ]</span></div>' +
                '<div class="pairing-log">LOG: ' + escapeHtml(h.line) + '</div>' +
              '</div>';
            }).join('');
          } else {
            titleText = m.pkg;
            
            var filteredLines = (m.logLines || []);
            var isAdbPort = m.pkg === 'adb.tcp.port';
            
            var importantLines = filteredLines.filter(function(l) {
              if (isAdbPort) {
                return /adb\.tcp\.port\s*=\s*\d+/i.test(l);
              }
              return l.indexOf('Uninstall') !== -1 || l.indexOf('Install') !== -1;
            });
            
            // FILTRO AGRESSIVO: Mostra apenas 1 linha para a maioria, mas para ADB mostra todas as logs relevantes
            var linesToDisplay = [];
            if (isAdbPort) {
              // Para ADB, mostra todas as logs encontradas (configurações, serviços e conexões)
              // Remove apenas duplicatas exatas de conteúdo
              var seen = {};
              linesToDisplay = filteredLines.filter(function(l) {
                var norm = l.trim().toLowerCase();
                if (seen[norm]) return false;
                seen[norm] = true;
                return true;
              });
            } else {
              var lineToShow = importantLines.length > 0 ? importantLines[importantLines.length - 1] : filteredLines[0];
              if (lineToShow) linesToDisplay.push(lineToShow);
            }

            var linesHtml = linesToDisplay.map(function(l) {
              // Se for detecção de porta ADB, não corta a linha para garantir que o valor apareça
              var cleaned = isAdbPort ? l.trim() : cleanLogLine(l, m.pkg);
              var highlighted = highlightTerm(cleaned, m.pkg, cat.title);
              var warning = '';
              
              if (cat.key === 'proxy' || cat.key === 'root') {
                if (l === globalOldest) warning = '<span class="log-warning oldest">⚠️ MAIS ANTIGA</span>';
                if (l === globalNewest) warning = '<span class="log-warning newest">⚠️ MAIS RECENTE</span>';
                if (globalOldest === globalNewest && l === globalOldest) {
                  warning = '<span class="log-warning newest">⚠️ ÚNICA/RECENTE</span>';
                }
              }
              
              return '<div class="cat-item-log-wrapper">' +
                       warning +
                       '<span class="cat-item-log">' + highlighted + '</span>' +
                     '</div>';
            }).join('');

            bodyHtml = linesHtml || ('<span class="cat-item-log">' + escapeHtml(m.pkg) + '</span>');
          }

          item.innerHTML =
            '<div class="cat-item-name">' + escapeHtml(titleText) + '</div>' +
            bodyHtml;

          body.appendChild(item);
        });
      }

      card.appendChild(body);
      header.addEventListener('click', function() { card.classList.toggle('collapsed'); });
      categoryCardsEl.appendChild(card);
    });
  }

})();
