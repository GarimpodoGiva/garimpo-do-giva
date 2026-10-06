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
  const cortes=[" com Fundo Removível"," para Presunto e Queijo"," Kit Prático com 10 Peças - Jaguar Utilidades"," 2 em 1"," Portátil Cozinha a Vapor 110V/220V"];
  let t=n;
  for(const corte of cortes)t=t.replace(corte,"");
  return t.trim();
}

function renderProdutos(produtos){
  contadorEl.textContent=produtos.length?produtos.length+" achado(s)":"";
  if(!produtos.length){
    produtosEl.innerHTML='<article class="vazio"><div class="icone">🔎</div><h3>O garimpo está começando</h3><p>Estamos preparando os primeiros produtos selecionados. Quando os achados entrarem, eles aparecerão aqui com suas informações e links.</p></article>';
    return;
  }
  produtosEl.innerHTML=produtos.map(p=>{
    const imagem=p.imagem?'<img src="'+escapeHtml(p.imagem)+'" alt="'+escapeHtml(p.nome)+'" loading="lazy" onerror="this.parentElement.innerHTML=\'🔎\';">':"🔎";
    const avaliacao=p.avaliacao?'<div class="produto-avaliacao"><span>★</span> '+escapeHtml(p.avaliacao)+' <small>· '+escapeHtml(p.avaliacoes||"avaliações")+'</small></div>':"";
    const preco=p.preco!=null?'<div class="produto-preco">'+formatarPreco(p.preco)+'</div>':"";
    const link=p.link?'<a class="btn btn-primary" href="'+escapeHtml(p.link)+'" target="_blank" rel="nofollow sponsored noopener">Ver achado</a>':"";
    return '<article class="produto"><div class="produto-imagem">'+imagem+'</div><div class="produto-corpo"><div class="produto-cat">'+escapeHtml(p.categoria||"Achado")+'</div><h3>'+escapeHtml(tituloVitrine(p.nome))+'</h3>'+avaliacao+preco+link+'</div></article>';
  }).join("");
}

const STORAGE_KEY="garimpo_central_vitrine_lab_v1";
const SUPABASE_URL="https://nzkcgejlzxlmntjfffai.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_sVxfeNWjGUYcdeW6O4pMyg_JIRLJxIV";

async function carregarProdutos(){
  try{
    const response=await fetch(SUPABASE_URL+"/rest/v1/garimpo_produtos?select=*&order=id.asc",{
      cache:"no-store",
      headers:{
        apikey:SUPABASE_PUBLISHABLE_KEY,
        Authorization:"Bearer "+SUPABASE_PUBLISHABLE_KEY
      }
    });
    if(response.ok){
      const data=await response.json();
      if(Array.isArray(data)&&data.length){
        return data.map(p=>({...p,avaliacao:p.avaliacao??p.nota}));
      }
    }else{
      console.warn("Supabase do catálogo respondeu",response.status);
    }
  }catch(error){
    console.warn("Falha ao carregar catálogo do Supabase:",error);
  }

  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw){
      const produtos=JSON.parse(raw);
      if(Array.isArray(produtos)&&produtos.length)return produtos;
    }
  }catch(e){}

  try{
    const response=await fetch("produtos.json",{cache:"no-store"});
    if(!response.ok)throw new Error("Falha ao carregar catálogo");
    const data=await response.json();
    return Array.isArray(data.produtos)?data.produtos:[];
  }catch(error){
    console.error("Falha no catálogo:",error);
    return [];
  }
}

function adaptarParaVitrine(produtos){
  return produtos
    .filter(p=>String(p.status||"").toLowerCase()==="publicado")
    .map(p=>({...p,avaliacao:p.avaliacao??p.nota}));
}

async function iniciarVitrine(){
  const produtos=await carregarProdutos();
  renderProdutos(adaptarParaVitrine(produtos));
}

iniciarVitrine();

window.addEventListener("storage",event=>{
  if(event.key===STORAGE_KEY){
    try{
      const produtos=JSON.parse(event.newValue||"[]");
      renderProdutos(adaptarParaVitrine(Array.isArray(produtos)?produtos:[]));
    }catch(e){}
  }
});
