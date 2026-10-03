const STORAGE_KEY = "garimpo_central_vitrine_lab_v1";

const ADMIN_EMAIL = "garimpodogiva@gmail.com";

let supabaseClient = null;
let produtos = [];
let editId = null;
let currentUser = null;

const seed = [
  {
    id:"p1", nome:"Porta Frios Duplo Preto para Presunto e Queijo com Fundo Removível",
    categoria:"Cozinha e organização", preco:17.70, comissao:15, nota:4.6,
    avaliacoes:"29,1 mil", vendidos:"10 mil+/mês", loja:"Vip Todo Dia",
    imagem:"https://http2.mlstatic.com/D_649187-MLB83596076407_042025-O.jpg",
    link:"https://s.shopee.com.br/5q8ckU6kWO", status:"publicado", observacao:"Produto visual e útil."
  },
  {
    id:"p2", nome:"Suporte Organizador de Metal Rack de Parede Banheiro Cozinha",
    categoria:"Casa, banheiro e cozinha", preco:9.90, comissao:6, nota:4.8,
    avaliacoes:"87,1 mil", vendidos:"10 mil+/mês", loja:"Forte DMS Brasil",
    imagem:"https://down-br.img.susercontent.com/file/br-11134207-7r98o-lrw1bg4e9ov83c",
    link:"https://s.shopee.com.br/5fpCaBntYC", status:"publicado", observacao:"Grande volume de avaliações."
  },
  {
    id:"p3", nome:"Jogo de Pote Plástico Kit Prático com 10 Peças - Jaguar Utilidades",
    categoria:"Cozinha e organização", preco:26.90, comissao:15, nota:4.7,
    avaliacoes:"3,3 mil", vendidos:"994/mês", loja:"Atacadão Ecommerce.Net",
    imagem:"https://down-br.img.susercontent.com/file/br-11134207-7qukw-leriyj1w3kyz5d",
    link:"https://s.shopee.com.br/LngEEGdb6", status:"publicado", observacao:"Kit com boa apresentação."
  },
  {
    id:"p4", nome:"Batedor Misturador Mixer Elétrico para Bebidas Leite Café Clara de Ovo",
    categoria:"Cozinha e utilidades", preco:18.99, comissao:15, nota:4.8,
    avaliacoes:"120,3 mil", vendidos:"20 mil+/mês", loja:"Isabela Top",
    imagem:"https://down-br.img.susercontent.com/file/br-11134207-820mg-mo5i3q9y4wlea9",
    link:"https://s.shopee.com.br/AKb28EEanb", status:"publicado", observacao:"Produto com alto volume de avaliações."
  },
  {
    id:"p5", nome:"Cozedor de Ovos Elétrico Portátil Cozinha a Vapor 110V/220V",
    categoria:"Cozinha e eletroportáteis", preco:29.98, comissao:13, nota:4.9,
    avaliacoes:"25,1 mil", vendidos:"10 mil+/mês", loja:"PENGFA TECH LTDA",
    imagem:"https://down-br.img.susercontent.com/file/sg-11134253-824hs-me4i9abn2b5z84",
    link:"https://s.shopee.com.br/8Kpxki4pZF", status:"publicado", observacao:"Nota muito alta."
  }
];

const $ = id => document.getElementById(id);
const money = v => Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

document.addEventListener("DOMContentLoaded", init);

async function init(){
  const config = window.GARIMPO_SUPABASE || {};
  const url = config.url || "";
  const key = config.publishableKey || "";

  if(!url || !key || key.includes("COLE_AQUI")){
    showLoginMessage("Falta configurar a conexão do Supabase.", true);
    $("loginBtn").disabled = true;
    return;
  }

  supabaseClient = window.supabase.createClient(url, key, {
    auth:{
      autoRefreshToken:true,
      persistSession:true,
      detectSessionInUrl:false
    }
  });

  bindEvents();

  const {data:{session}} = await supabaseClient.auth.getSession();

  if(session?.user){
    await enterAdmin(session.user);
  }else{
    showLogin();
  }

  supabaseClient.auth.onAuthStateChange(async (event, session)=>{
    if(session?.user){
      await enterAdmin(session.user);
    }else if(event === "SIGNED_OUT"){
      showLogin();
    }
  });
}

function bindEvents(){
  $("loginForm").addEventListener("submit", handleLogin);
  $("logoutBtn").addEventListener("click", handleLogout);

  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      togglePassword.textContent = "🙈";
      togglePassword.setAttribute("aria-label", "Ocultar senha");
      togglePassword.setAttribute("title", "Ocultar senha");
    } else {
      passwordInput.type = "password";
      togglePassword.textContent = "👁";
      togglePassword.setAttribute("aria-label", "Mostrar senha");
      togglePassword.setAttribute("title", "Mostrar senha");
    }

  });
}

  $("btnNovo").onclick=()=>openEditor();
  $("btnFechar").onclick=closeEditor;
  $("btnCancelar").onclick=closeEditor;
  $("busca").oninput=render;

  ["preco","comissao","nota","vendidos","avaliacoes"]
    .forEach(id=>$(id).addEventListener("input",updateScore));

  $("status").addEventListener("change",updateScore);
  $("formProduto").addEventListener("submit", saveProduct);
  $("btnExcluir").onclick=deleteCurrentProduct;
}

async function handleLogin(event){
  event.preventDefault();

  clearLoginMessage();

  const email = $("email").value.trim();
  const password = $("password").value;

  if(email.toLowerCase() !== ADMIN_EMAIL){
    showLoginMessage(
      "Este acesso é reservado ao administrador do Garimpo do Giva.",
      true
    );
    return;
  }

  const button = $("loginBtn");

  button.disabled = true;
  button.textContent = "Entrando...";

  const {data,error} =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  button.disabled = false;
  button.textContent = "Entrar na Central";

  if(error){
    showLoginMessage(
      "Não foi possível entrar. Confira o e-mail e a senha.",
      true
    );
    return;
  }

  if(!data.user){
    showLoginMessage("Login sem usuário autenticado.", true);
    return;
  }

  $("password").value = "";
  await enterAdmin(data.user);
}

async function handleLogout(){

  if(!supabaseClient) return;

  const {error} = await supabaseClient.auth.signOut();

  if(error){
    alert("Não foi possível sair da Central.");
    return;
  }

  currentUser = null;
  produtos = [];
  editId = null;

  closeEditor();
  showLogin();

  $("password").value = "";

  $("loginMessage").textContent =
    "Você saiu da Central com segurança.";

  $("loginMessage").className = "login-message";
}

async function enterAdmin(user){

  currentUser = user;

  if((user.email || "").toLowerCase() !== ADMIN_EMAIL){

    await supabaseClient.auth.signOut();

    showLoginMessage(
      "Usuário não autorizado para esta Central.",
      true
    );

    return;
  }

  $("userEmail").textContent = user.email;

  $("loginView").classList.add("hidden");
  $("adminView").classList.remove("hidden");

  clearLoginMessage();

  produtos = load();

  render();
}

function showLogin(){

  $("adminView").classList.add("hidden");
  $("loginView").classList.remove("hidden");

  $("email").value = ADMIN_EMAIL;
  $("password").focus();
}

function load(){

  try{
    const raw = localStorage.getItem(STORAGE_KEY);

    return raw
      ? JSON.parse(raw)
      : seed.map(x=>({...x}));

  }catch(e){
    return seed.map(x=>({...x}));
  }
}

function persist(){

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(produtos)
  );

}

function calcScore(p){

  const sales = String(p.vendidos||"").toLowerCase();

  let s=0;

  if(sales.includes("200 mil") || sales.includes("100 mil"))
    s+=30;
  else if(sales.includes("50 mil") || sales.includes("20 mil"))
    s+=27;
  else if(sales.includes("10 mil"))
    s+=24;
  else if(sales.includes("mil"))
    s+=18;
  else if(sales)
    s+=10;

  s += Math.min(
    20,
    Math.max(0,(Number(p.nota)||0)*4)
  );

  s += Math.min(
    20,
    Math.max(0,Number(p.comissao)||0)*1.33
  );

  const reviews =
    String(p.avaliacoes||"").toLowerCase();

  if(reviews.includes("100 mil"))
    s+=15;
  else if(reviews.includes("50 mil"))
    s+=14;
  else if(reviews.includes("20 mil"))
    s+=13;
  else if(reviews.includes("10 mil"))
    s+=12;
  else if(reviews.includes("mil"))
    s+=9;
  else if(reviews)
    s+=5;

  const price=Number(p.preco)||0;

  if(price>=9 && price<=30)
    s+=15;
  else if(price>30 && price<=60)
    s+=10;
  else if(price>0)
    s+=6;

  return Math.round(Math.min(100,s));
}

function render(){

  const q =
    $("busca").value.trim().toLowerCase();

  const filtered =
    produtos.filter(p=>
      [p.nome,p.categoria,p.loja,p.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );

  $("statTotal").textContent =
    produtos.length;

  $("statAprovados").textContent =
    produtos.filter(p=>p.status==="aprovado").length;

  $("statPublicados").textContent =
    produtos.filter(p=>p.status==="publicado").length;

  $("statScore").textContent =
    produtos.length
      ? Math.round(
          produtos.reduce(
            (a,p)=>a+calcScore(p),
            0
          ) / produtos.length
        )
      : 0;

  const list=$("lista");

  if(!filtered.length){

    list.innerHTML =
      '<div class="empty"><strong>Nenhum produto encontrado.</strong>Cadastre um novo produto ou altere a busca.</div>';

    return;
  }

  list.innerHTML=filtered.map(p=>{

    const score=calcScore(p);

    const img=p.imagem
      ? `<img class="product-img" src="${escapeAttr(p.imagem)}" alt="">`
      : `<div class="product-img"></div>`;

    return `<article class="product">
      ${img}

      <div>
        <div class="product-name">${escapeHtml(p.nome)}</div>

        <div class="product-meta">
          ${escapeHtml(p.categoria||"Sem categoria")}
          ·
          ${escapeHtml(p.loja||"Sem loja")}
          ·
          ${money(p.preco)}
        </div>

        <div class="product-meta">
          ★ ${Number(p.nota||0).toFixed(1)}
          ·
          ${escapeHtml(p.avaliacoes||"sem avaliações")}
        </div>
      </div>

      <div class="product-actions">

        <div class="score">${score}</div>

        <span class="status status-${p.status}">
          ${p.status}
        </span>

        <button
          class="btn btn-ghost"
          onclick="editProduct('${p.id}')"
        >
          Editar
        </button>

      </div>

    </article>`;

  }).join("");

}

function openEditor(p=null){

  editId=p?.id||null;

  $("editorTitle").textContent =
    p ? "Editar produto" : "Novo produto";

  $("produtoId").value=p?.id||"";
  $("nome").value=p?.nome||"";
  $("categoria").value=p?.categoria||"";
  $("loja").value=p?.loja||"";
  $("preco").value=p?.preco??"";
  $("comissao").value=p?.comissao??"";
  $("nota").value=p?.nota??"";
  $("avaliacoes").value=p?.avaliacoes||"";
  $("vendidos").value=p?.vendidos||"";
  $("imagem").value=p?.imagem||"";
  $("link").value=p?.link||"";
  $("status").value=p?.status||"reserva";
  $("observacao").value=p?.observacao||"";

  $("btnExcluir").style.visibility =
    p ? "visible" : "hidden";

  $("editor").scrollIntoView({
    behavior:"smooth",
    block:"start"
  });

  updateScore();
}

function closeEditor(){

  editId=null;

  $("formProduto").reset();

  $("scorePreview").textContent="0/100";

  $("btnExcluir").style.visibility="hidden";
}

function editProduct(id){

  const p=produtos.find(x=>x.id===id);

  if(p)
    openEditor(p);
}

window.editProduct=editProduct;

function formData(){

  return {

    id:editId || "p_"+Date.now(),

    nome:$("nome").value.trim(),

    categoria:$("categoria").value.trim(),

    loja:$("loja").value.trim(),

    preco:Number($("preco").value||0),

    comissao:Number($("comissao").value||0),

    nota:Number($("nota").value||0),

    avaliacoes:$("avaliacoes").value.trim(),

    vendidos:$("vendidos").value.trim(),

    imagem:$("imagem").value.trim(),

    link:$("link").value.trim(),

    status:$("status").value,

    observacao:$("observacao").value.trim()

  };
}

function updateScore(){

  $("scorePreview").textContent =
    calcScore(formData())+"/100";

}

function saveProduct(event){

  event.preventDefault();

  const p=formData();

  if(!p.nome || !p.link){

    alert(
      "Preencha pelo menos o nome e o link de afiliado."
    );

    return;
  }

  const idx =
    produtos.findIndex(x=>x.id===p.id);

  if(idx>=0)
    produtos[idx]=p;
  else
    produtos.unshift(p);

  persist();

  render();

  openEditor(p);

  alert("Produto salvo na Central.");
}

function deleteCurrentProduct(){

  if(!editId)
    return;

  const p =
    produtos.find(x=>x.id===editId);

  if(!p)
    return;

  if(confirm(`Excluir "${p.nome}"?`)){

    produtos =
      produtos.filter(x=>x.id!==editId);

    persist();

    closeEditor();

    render();

  }
}

function escapeHtml(s){

  return String(s??"").replace(
    /[&<>"']/g,
    m=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[m])
  );

}

function escapeAttr(s){

  return escapeHtml(s);

}

function showLoginMessage(message,error=false){

  const el=$("loginMessage");

  el.textContent=message;

  el.style.color =
    error ? "#b42318" : "";

}

function clearLoginMessage(){

  $("loginMessage").textContent="";

  $("loginMessage").style.color="";

}