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

function tituloVitrine(nome){
  const n=String(nome||"").trim();
  const cortes=[
    " com Fundo Removível",
    " para Presunto e Queijo",
    " Kit Prático com 10 Peças - Jaguar Utilidades",
    " 2 em 1",
    " Portátil Cozinha a Vapor 110V/220V"
  ];
  let t=n;
  for(const corte of cortes){
    t=t.replace(corte,"");
  }
  return t.trim();
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

    const avaliacao = p.avaliacao
      ? '<div class="produto-avaliacao"><span>★</span> '+escapeHtml(p.avaliacao)+' <small>· '+escapeHtml(p.avaliacoes||"avaliações")+'</small></div>'
      : "";

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
      +'<h3>'+escapeHtml(tituloVitrine(p.nome))+'</h3>'
      +avaliacao
      +preco
      +link
      +'</div></article>';
  }).join("");
}

const CATALOGO_TESTE=[{"id": 1, "nome": "Porta Frios Duplo Preto para Presunto e Queijo com Fundo Removível", "categoria": "Cozinha e organização", "preco": 17.7, "preco_maximo": 17.7, "comissao_percentual": 15, "vendas_portal": "10 mil+/mês", "vendas_anuncio": "50 mil+", "avaliacao": 4.6, "avaliacoes": "29,1 mil", "loja": "Vip Todo Dia", "link": "https://s.shopee.com.br/5q8ckU6kWO", "imagem": "https://http2.mlstatic.com/D_649187-MLB83596076407_042025-O.jpg", "score_garimpo": 99, "status": "aprovado", "verificado_em": "02/10/2026"}, {"id": 2, "nome": "Suporte Organizador de Metal Rack de Parede Banheiro Cozinha", "categoria": "Casa, banheiro e cozinha", "preco": 9.9, "preco_maximo": 9.9, "comissao_percentual": 6, "vendas_portal": "10 mil+/mês", "vendas_anuncio": "100 mil+", "avaliacao": 4.8, "avaliacoes": "87,1 mil", "loja": "Forte DMS Brasil", "link": "https://s.shopee.com.br/5fpCaBntYC", "imagem": "https://down-br.img.susercontent.com/file/br-11134207-7r98o-lrw1bg4e9ov83c", "score_garimpo": 89, "status": "reserva", "verificado_em": "02/10/2026"}, {"id": 3, "nome": "Jogo de Pote Plástico Kit Prático com 10 Peças - Jaguar Utilidades", "categoria": "Cozinha e organização", "preco": 26.9, "preco_maximo": 28.49, "comissao_percentual": 15, "vendas_portal": "994/mês", "vendas_anuncio": "7 mil+", "avaliacao": 4.7, "avaliacoes": "3,3 mil", "loja": "Atacadão Ecommerce.Net", "link": "https://s.shopee.com.br/LngEEGdb6", "imagem": "https://down-br.img.susercontent.com/file/br-11134207-7qukw-leriyj1w3kyz5d", "score_garimpo": 90, "status": "reserva", "verificado_em": "02/10/2026"}, {"id": 4, "nome": "Batedor Misturador Mixer Elétrico para Bebidas Leite Café Clara de Ovo 2 em 1", "categoria": "Cozinha e utilidades", "preco": 18.99, "preco_maximo": 18.99, "comissao_percentual": 15, "vendas_portal": "20 mil+/mês", "vendas_anuncio": "200 mil+", "avaliacao": 4.8, "avaliacoes": "120,3 mil", "loja": "Isabela Top", "link": "https://s.shopee.com.br/AKb28EEanb", "imagem": "https://down-br.img.susercontent.com/file/br-11134207-820mg-mo5i3q9y4wlea9", "score_garimpo": 99, "status": "aprovado", "verificado_em": "02/10/2026"}, {"id": 5, "nome": "Cozedor de Ovos Elétrico Portátil Cozinha a Vapor 110V/220V", "categoria": "Cozinha e eletroportáteis", "preco": 29.98, "preco_maximo": 37.99, "comissao_percentual": 13, "vendas_portal": "10 mil+/mês", "vendas_anuncio": "50 mil+", "avaliacao": 4.9, "avaliacoes": "25,1 mil", "loja": "PENGFA TECH LTDA", "link": "https://s.shopee.com.br/8Kpxki4pZF", "imagem": "https://down-br.img.susercontent.com/file/sg-11134253-824hs-me4i9abn2b5z84", "score_garimpo": 96, "status": "aprovado", "verificado_em": "02/10/2026"}];

const STORAGE_KEY = "garimpo_central_vitrine_lab_v1";

function carregarProdutos(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const produtos = JSON.parse(raw);
      if(Array.isArray(produtos)) return Promise.resolve(produtos);
    }
  }catch(e){}

  return fetch("produtos.json",{cache:"no-store"})
    .then(r=>r.ok?r.json():Promise.reject(new Error("Falha ao carregar catálogo")))
    .then(d=>Array.isArray(d.produtos)?d.produtos:[]);
}

function adaptarParaVitrine(produtos){
  return produtos
    .filter(p => String(p.status||"").toLowerCase() === "publicado")
    .map(p => ({...p, avaliacao: p.avaliacao ?? p.nota}));
}

function iniciarVitrine(){
  carregarProdutos().then(produtos=>renderProdutos(adaptarParaVitrine(produtos)));
}

iniciarVitrine();

// Atualiza a vitrine automaticamente se a Central mudar os dados em outra aba.
window.addEventListener("storage", event=>{
  if(event.key === STORAGE_KEY){
    try{
      const produtos = JSON.parse(event.newValue || "[]");
      renderProdutos(adaptarParaVitrine(Array.isArray(produtos)?produtos:[]));
    }catch(e){}
  }
});
