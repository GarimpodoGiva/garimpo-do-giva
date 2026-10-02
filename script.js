const produtosEl=document.getElementById("produtos"),contadorEl=document.getElementById("contador"),anoEl=document.getElementById("ano");
anoEl.textContent=new Date().getFullYear();

function escapeHtml(v){
  return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

function formatarPreco(valor){
  const numero=Number(valor);
  if(!Number.isFinite(numero)) return "";
  return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(numero);
}

function renderProdutos(produtos){
  contadorEl.textContent=produtos.length?produtos.length+" achado(s)":"";

  if(!produtos.length){
    produtosEl.innerHTML='<article class="vazio"><div class="icone">🔎</div><h3>O garimpo está começando</h3><p>Estamos preparando os primeiros produtos selecionados. Quando os achados entrarem, eles aparecerão aqui com suas informações e links.</p></article>';
    return;
  }

  produtosEl.innerHTML=produtos.map(p=>{
    const imagem=p.imagem
      ? '<img src="'+escapeHtml(p.imagem)+'" alt="'+escapeHtml(p.nome)+'" loading="lazy" onerror="this.parentElement.innerHTML=\'🔎\';">'
      : "🔎";

    const preco=p.preco!=null
      ? '<div class="produto-preco">'+formatarPreco(p.preco)+'</div>'
      : "";

    const link=p.link
      ? '<a class="btn btn-primary" href="'+escapeHtml(p.link)+'" target="_blank" rel="nofollow sponsored noopener">Ver achado</a>'
      : "";

    return '<article class="produto">'
      +'<div class="produto-imagem">'+imagem+'</div>'
      +'<div class="produto-corpo">'
      +'<div class="produto-cat">'+escapeHtml(p.categoria||"Achado")+'</div>'
      +'<h3>'+escapeHtml(p.nome)+'</h3>'
      +preco
      +link
      +'</div></article>';
  }).join("");
}

fetch("produtos.json",{cache:"no-store"})
  .then(r=>r.ok?r.json():Promise.reject(new Error("Falha ao carregar produtos.json")))
  .then(d=>renderProdutos(d.produtos||[]))
  .catch(()=>renderProdutos([]));
