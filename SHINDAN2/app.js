let step = -1;
let selections = [];
let busy = false;
let timer = null;

function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function reducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
function update(html, announcement) {
  app.innerHTML = html;
  document.querySelector('#diagnosis-status').textContent = announcement;
  app.querySelector('h1, h2')?.focus({preventScroll:true});
  window.scrollTo({top:0, behavior:'instant'});
}
function renderStart() {
  clearTimeout(timer);
  step = -1; selections = []; busy = false;
  document.body.classList.remove('compact', 'result-view', 'is-absorbing');
  update(`<section class="crystal-intro">
    <span class="eyebrow">FIND YOUR FORTUNE METHOD</span>
    <h1 tabindex="-1">今のあなたに合う<br>占術を見つける</h1>
    <p class="intro-lead">知りたいことが同じでも、<br>占い方によって、得意な見方は異なります。</p>
    ${crystal('<span class="orb-inner-light" aria-hidden="true"></span><span class="orb-intro-label">YOUR OWN WAY TO THE ANSWER</span>',0,'intro-orb')}
    <p class="intro-prompt">求める答えや、準備できる情報から。<br>3つの質問で、あなたに合いやすい占術をご案内します。</p>
    <button class="primary" id="start">占術診断をはじめる<span class="arrow" aria-hidden="true">✧</span></button>
    <div class="intro-assurances"><span>約1分・全3問</span><span>無料・登録不要</span></div>
    <p class="intro-categories">タロット / 霊視 / 四柱推命 / 西洋占星術 / オラクル</p>
    <p class="quiet">悩みの入力は不要です。回答内容は保存されません。</p>
    <a class="return-link" href="../SHINDAN/index.html">← お悩み診断へ戻る</a>
  </section>`, '占術診断。全3問です。');
  document.querySelector('#start').onclick = () => { step = 0; renderQuestion(); };
}
function renderQuestion() {
  busy = false;
  document.body.classList.add('compact');
  document.body.classList.remove('result-view', 'is-absorbing');
  const q = questions[step];
  update(`<div class="step-line"><span>QUESTION <strong>0${step+1}</strong> / 03</span><span>あと${3-step}問</span></div>
    <div class="journey-progress" role="progressbar" aria-label="診断の回答済み質問数" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${step}" style="--journey-fill:${step*100/3}%"><span class="journey-liquid"><span class="journey-wave"></span></span><span class="journey-ticks" aria-hidden="true"><i></i><i></i></span></div>
    <div class="journey-caption"><span>水晶に、あなたの想いを集めています</span><span>${step} / 3 回答</span></div>
    <div class="question-heading"><h2 class="question" tabindex="-1">${esc(q.title)}</h2><p class="subtext">${esc(q.note)}</p></div>
    ${crystal('<span class="orb-inner-light" aria-hidden="true"></span>',step,'question-orb')}
    <div class="options">${q.options.map((option,index)=>`<button class="option" data-index="${index}"><span class="answer-gem" aria-hidden="true"></span><span class="option-label">${option[0]}</span><span class="chevron" aria-hidden="true">›</span></button>`).join('')}</div>
    <div class="navigation"><button class="back" id="back">← ${step ? '前の質問へ' : 'はじめに戻る'}</button><span class="nav-note">ひとつ選ぶと次へ進みます</span></div>`, `質問${step+1} / 3`);
  app.querySelectorAll('[data-index]').forEach(button => button.onclick = () => choose(Number(button.dataset.index)));
  document.querySelector('#back').onclick = () => {
    if(busy) return;
    if(step === 0) renderStart(); else { step--; renderQuestion(); }
  };
}
function choose(choice) {
  if(busy) return;
  busy = true;
  selections[step] = choice;
  selections.length = step+1;
  app.querySelectorAll('[data-index]').forEach(button => {
    button.disabled = true;
    button.classList.add(Number(button.dataset.index) === choice ? 'chosen' : 'unpicked');
  });
  const stage = document.querySelector('#crystal-stage');
  stage.style.setProperty('--charge', (step+1)/3);
  stage.style.setProperty('--charge-level', `${(step+1)*100/3}%`);
  stage.classList.add('energy-added');
  const progress = app.querySelector('.journey-progress');
  progress.style.setProperty('--journey-fill', `${(step+1)*100/3}%`);
  progress.setAttribute('aria-valuenow', step+1);
  app.querySelectorAll('.gem')[step].classList.add('lit');
  app.querySelector('.gem-progress').setAttribute('aria-valuenow', step+1);
  timer = setTimeout(() => {
    step++; busy = false;
    if(step < questions.length) renderQuestion(); else renderLoading();
  }, reducedMotion() ? 0 : 350);
}
function renderLoading() {
  update(`<section class="crystal-reading"><span class="eyebrow">YOUR FORTUNE METHOD</span><h2 tabindex="-1">あなたに合う占術を、<br>水晶に映しています。</h2>${crystal('<span class="result-sphere-label">YOUR OWN WAY</span><p class="sphere-result-title">あなたの答えに、<br>近づくために。</p>',3,'revelation-orb')}<p>求める答えと、占い方の相性を整理しています。</p></section>`, '回答から、あなたに合いやすい占術を選んでいます。');
  timer = setTimeout(renderResult, reducedMotion() ? 0 : 850);
}
function rankMethods() {
  const score = Object.fromEntries(Object.keys(methods).map(k=>[k,0]));
  selections.forEach((choice,qi)=>{
    const weights = questions[qi].options[choice][1];
    Object.entries(weights).forEach(([key,val])=>score[key]+=val);
  });
  const order = ['tarot','psychic','shichu','astrology','oracle'];
  return order.sort((a,b)=>score[b]-score[a] || order.indexOf(a)-order.indexOf(b));
}
function renderResult() {
  document.body.classList.add('result-view');
  const ranked = rankMethods();
  const m = methods[ranked[0]];
  update(`<div class="result-crystal-top">${crystal(`<span class="reveal-sigil" aria-hidden="true">${m.icon}</span>`,3,'revealed-orb')}</div>
    <article class="crystal-result">
      <section class="result-chapter chapter-theme" aria-labelledby="method-title">
        <div class="chapter-label"><span>01</span> YOUR FORTUNE METHOD</div>
        <span class="eyebrow">A WAY TO YOUR ANSWER</span><p class="quiet">今のあなたに最も合いやすい占術</p>
        <h2 class="result-heading" id="method-title" tabindex="-1">${esc(m.name)}</h2>
        <div class="quote method-lead"><strong>${esc(m.lead)}</strong></div><p class="summary">${esc(m.copy)}</p>
      </section>
      <section class="result-chapter chapter-topics" aria-labelledby="topics-heading">
        <div class="chapter-label"><span>02</span> YOUR NEXT HINT</div><h3 class="topic-title" id="topics-heading">この占術で相談しやすいこと</h3>
        ${m.items.map((item,index)=>`<div class="topic"><span class="number">0${index+1}</span><div><strong>${esc(item)}</strong></div></div>`).join('')}
      </section>
      <section class="result-chapter" aria-labelledby="alternatives-heading">
        <div class="chapter-label"><span>03</span> ANOTHER WAY</div><h3 class="chapter-heading" id="alternatives-heading">あわせて相性のよい占術</h3>
        <div class="method-chips">${ranked.slice(1,3).map(key=>`<span>${esc(methods[key].name)}</span>`).join('')}</div>
      </section>
      <div class="consult"><span class="offer-kicker">あなたに合う占いの方法が見つかったら</span><h3>次は、相談する占い師を<br>探してみませんか？</h3>
        <p>知りたいことや、占い師が得意とする占術を見ながら、あなたが相談しやすい先生を探してみましょう。</p>
        <a class="primary result-cta" href="${DESTINATION}" target="_blank" rel="noopener sponsored"><span class="cta-label">あなたに合う占い師を探してみる</span></a>
      </div>
      <div class="result-actions"><button class="text-button" id="edit">← 回答を見直す</button><button class="text-button" id="restart">もう一度診断する</button></div>
      <a class="return-link" href="../SHINDAN/index.html">お悩み診断へ戻る</a>
    </article>`, `診断結果は${m.name}です。`);
  document.querySelector('#edit').onclick = () => { step = 2; renderQuestion(); };
  document.querySelector('#restart').onclick = renderStart;
}
renderStart();
